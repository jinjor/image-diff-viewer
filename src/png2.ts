import * as fs from "fs";
import { Point, CompareImage, DiffResultGroup, Area } from "./types";
import diff from "wu-diff-js";
import * as crypto from "crypto";

const PNG = require("pngjs").PNG;

type UpdateType = "added" | "removed" | "updated" | "replaced";
class UpdateGroup {
  constructor(
    public left: { min: number; length: number },
    public right: { min: number; length: number }
  ) {}
  get type(): UpdateType {
    if (!this.left) {
      return "added";
    }
    if (!this.right) {
      return "removed";
    }
    if (this.left.length === this.right.length) {
      return "updated";
    }
    return "replaced";
  }
}

export function groupDiffResult(result: any): UpdateGroup[] {
  let l = 0;
  let r = 0;
  let removed = 0;
  let added = 0;
  const groups: UpdateGroup[] = [];
  for (const res of result) {
    if (res.type === "added") {
      added++;
      r++;
    } else if (res.type === "removed") {
      removed++;
      l++;
    } else {
      addGroupIfNeeded();
      added = 0;
      removed = 0;
      l++;
      r++;
    }
  }
  addGroupIfNeeded();
  return groups;

  function addGroupIfNeeded() {
    let left;
    let right;
    if (removed) {
      left = { min: l - removed, length: removed };
    }
    if (added) {
      right = { min: r - added, length: added };
    }
    if (left || right) {
      groups.push(new UpdateGroup(left, right));
    }
  }
}

export const compareImage: CompareImage = (
  leftFile?: string,
  rightFile?: string
) => {
  const left = leftFile && PNG.sync.read(fs.readFileSync(leftFile));
  const right = rightFile && PNG.sync.read(fs.readFileSync(rightFile));
  let diffResultGroups = [];
  if (left && right) {
    diffResultGroups = tryHeuristicDiff(leftFile, rightFile);
  }
  const leftInfo = left && {
    path: leftFile,
    width: left.width,
    height: left.height
  };
  const rightInfo = right && {
    path: rightFile,
    width: right.width,
    height: right.height
  };
  return {
    left: leftInfo,
    right: rightInfo,
    results: diffResultGroups
  };
};

function tryHeuristicDiff(
  leftFile: string,
  rightFile: string
): DiffResultGroup[] {
  const left = leftFile && PNG.sync.read(fs.readFileSync(leftFile));
  const right = rightFile && PNG.sync.read(fs.readFileSync(rightFile));
  if (!left || !right) {
    return null;
  }
  const leftStringArray = stringifyColumns(left);
  const rightStringArray = stringifyColumns(right);
  const result = diff(leftStringArray, rightStringArray);
  console.log(left.width, right.width);
  const groups = groupDiffResult(result);
  const diffResultGroups: DiffResultGroup[] = [];
  for (const group of groups) {
    console.log("col", group.type, group.left, group.right);
    // if (group.left && group.left.length === 543) {
    //   for (let i = 0; i < left.height; i++) {
    //     console.log(
    //       leftStringArray[group.left.min + i],
    //       rightStringArray[group.right.min + i]
    //     );
    //   }
    // }
    // if (group.left && group.left.length === 1) {
    //   for (let i = 0; i < left.height; i++) {
    //     const leftColor = getPixelForDebug(left, group.left.min, i);
    //     const rightColor = getPixelForDebug(right, group.right.min, i);
    //     const rightColor2 = getPixelForDebug(right, group.right.min + 1, i);
    //     const different = leftColor !== rightColor;
    //     console.log(
    //       i,
    //       leftColor,
    //       rightColor,
    //       rightColor2,
    //       different ? "*" : ""
    //     );
    //   }
    // }
    if (group.type === "updated") {
      const leftMinX = group.left.min;
      const rightMinX = group.right.min;
      const width = group.left.length;
      const leftStringArray = stringifyRows(left, leftMinX, width);
      const rightStringArray = stringifyRows(right, rightMinX, width);
      const result = diff(leftStringArray, rightStringArray);
      const groups = groupDiffResult(result);
      for (const group of groups) {
        console.log("  row", group.type, group.left, group.right);
        if (group.type === "updated") {
          const height = group.left.length;
          const leftMinY = group.left.min;
          const rightMinY = group.right.min;
          const pointsInRect = collectPoints(
            left,
            right,
            width,
            height,
            leftMinX,
            leftMinY,
            rightMinX,
            rightMinY,
            3
          );
          diffResultGroups.push({
            type: "points",
            dx: rightMinX - leftMinX,
            dy: rightMinY - leftMinY,
            points: pointsInRect
          });
        } else {
          let leftArea = null;
          let rightArea = null;
          if (group.left) {
            const minY = group.left.min;
            const height = group.left.length;
            leftArea = { x: leftMinX, y: minY, width, height };
          }
          if (group.right) {
            const minY = group.right.min;
            const height = group.right.length;
            rightArea = { x: rightMinX, y: minY, width, height };
          }
          diffResultGroups.push({
            type: "area",
            left: leftArea,
            right: rightArea
          });
        }
      }
    } else {
      let leftArea = null;
      let rightArea = null;
      if (group.left) {
        const minX = group.left.min;
        const width = group.left.length;
        leftArea = { x: minX, y: 0, width, height: left.height };
      }
      if (group.right) {
        const minX = group.right.min;
        const width = group.right.length;
        rightArea = { x: minX, y: 0, width, height: right.height };
      }
      diffResultGroups.push({
        type: "area",
        left: leftArea,
        right: rightArea
      });
    }
  }
  saveImageForDebug(left, right, diffResultGroups);
  return diffResultGroups;
}

function saveImageForDebug(
  left: any,
  right: any,
  diffResultGroups: DiffResultGroup[]
): void {
  for (const diffResult of diffResultGroups) {
    if (diffResult.type === "points") {
      const { points, dx, dy } = diffResult;
      for (const point of points) {
        modifyColor(left, point[0], point[1], "fill");
        modifyColor(right, point[0] + dx, point[1] + dy, "fill");
      }
    } else {
      let leftColor: "r" | "y" = "r";
      let rightColor: "g" | "y" = "g";
      if (
        diffResult.left &&
        diffResult.right &&
        diffResult.left.width === diffResult.right.width &&
        diffResult.left.height === diffResult.right.height
      ) {
        leftColor = "y";
        rightColor = "y";
      }
      if (diffResult.left) {
        modifyAreaColor(left, diffResult.left, leftColor);
      }
      if (diffResult.right) {
        modifyAreaColor(right, diffResult.right, rightColor);
      }
    }
  }
  {
    const buffer = PNG.sync.write(left, { colorType: 6 });
    fs.writeFileSync(`work/out-heulistic-before.png`, buffer);
  }
  {
    const buffer = PNG.sync.write(right, { colorType: 6 });
    fs.writeFileSync(`work/out-heulistic-after.png`, buffer);
  }
}

function stringifyRows(png: any, minX: number, areaWidth: number): string[] {
  const width: number = png.width;
  const height: number = png.height;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = minX; x < minX + areaWidth; x++) {
      const idx = (width * y + x) << 2;
      row += png.data[idx];
      row += png.data[idx + 1];
      row += png.data[idx + 2];
    }
    const md5hash = crypto.createHash("md5");
    md5hash.update(row);
    rows.push(md5hash.digest("hex"));
  }
  return rows;
}
function getPixelForDebug(png: any, x: number, y: number): string {
  const idx = (png.width * y + x) << 2;
  return png.data[idx] + "," + png.data[idx + 1] + "," + png.data[idx + 2];
}

function stringifyColumns(png: any): string[] {
  const width: number = png.width;
  const height: number = png.height;
  const cols = [];
  for (let x = 0; x < width; x++) {
    let col = "";
    for (let y = 0; y < height; y++) {
      const idx = (width * y + x) << 2;
      col += png.data[idx];
      col += png.data[idx + 1];
      col += png.data[idx + 2];
    }
    const md5hash = crypto.createHash("md5");
    md5hash.update(col);
    cols.push(md5hash.digest("hex"));
  }
  return cols;
}
function modifyAreaColor(
  png: any,
  area: Area,
  color: "r" | "g" | "y" | "fill"
): void {
  const { x, y, width, height } = area;
  for (let i = x; i < x + width; i++) {
    for (let j = y; j < y + height; j++) {
      modifyColor(png, i, j, color);
    }
  }
}
function modifyColor(
  png: any,
  x: number,
  y: number,
  color: "r" | "g" | "y" | "fill"
): void {
  let idx = (png.width * y + x) << 2;
  if (color === "r") {
    png.data[idx] = Math.min(255, png.data[idx] * 1.5);
    png.data[idx + 1] = Math.max(0, png.data[idx + 1] * 0.7);
    png.data[idx + 2] = Math.max(0, png.data[idx + 2] * 0.7);
  } else if (color === "g") {
    png.data[idx] = Math.max(0, png.data[idx] * 0.7);
    png.data[idx + 1] = Math.min(255, png.data[idx + 1] * 1.5);
    png.data[idx + 2] = Math.max(0, png.data[idx + 2] * 0.7);
  } else if (color === "y") {
    png.data[idx] = Math.min(255, png.data[idx] * 1.5);
    png.data[idx + 1] = Math.min(255, png.data[idx + 1] * 1.5);
    png.data[idx + 2] = Math.max(0, png.data[idx + 2] * 0.7);
  } else if (color === "fill") {
    png.data[idx] = 255;
    png.data[idx + 1] = 0;
    png.data[idx + 2] = 0;
  }
}

function collectPoints(
  left: any,
  right: any,
  rectWidth: number,
  rectHeight: number,
  leftMinX: number,
  leftMinY: number,
  rightMinX: number,
  rightMinY: number,
  threshold: number
): Point[] {
  const points: Point[] = [];
  for (let y = 0; y < rectHeight; y++) {
    for (let x = 0; x < rectWidth; x++) {
      const leftX = leftMinX + x;
      const leftY = leftMinY + y;
      const leftIndex = (left.width * leftY + leftX) << 2;
      const rightX = rightMinX + x;
      const rightY = rightMinY + y;
      const rightIndex = (right.width * rightY + rightX) << 2;
      if (
        right.data[rightIndex] === undefined ||
        left.data[leftIndex] === undefined
      ) {
        points.push([leftX, leftY]);
        continue;
      }
      const dr = right.data[rightIndex] - left.data[leftIndex];
      const dg = right.data[rightIndex + 1] - left.data[leftIndex + 1];
      const db = right.data[rightIndex + 2] - left.data[leftIndex + 2];
      if (
        Math.abs(dr) > threshold ||
        Math.abs(dg) > threshold ||
        Math.abs(db) > threshold
      ) {
        points.push([leftX, leftY]);
      }
    }
  }
  return points;
}
