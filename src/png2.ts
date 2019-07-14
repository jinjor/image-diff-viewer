import * as fs from "fs";
import { Point, CompareImage } from "./types";
import diff from "wu-diff-js";
import * as crypto from "crypto";

const PNG = require("pngjs").PNG;

type LR = {
  l: number;
  r: number;
};
type LRsType = "added" | "removed" | "updated" | "replaced";
type LRs = {
  type: LRsType;
  items: LR[];
};

export function diffResultToLR(result: any): LRs[] {
  let l = 0;
  let r = 0;
  let removed = [];
  let added = [];
  const groups: LRs[] = [];
  for (const res of result) {
    if (res.type === "added") {
      added.push(r);
      r++;
    } else if (res.type === "removed") {
      removed.push(l);
      l++;
    } else {
      addGroupIfNeeded();
      added.length = 0;
      removed.length = 0;
      l++;
      r++;
    }
  }
  addGroupIfNeeded();
  return groups;

  function addGroupIfNeeded() {
    const lrs: LR[] = [];
    if (added.length || removed.length) {
      let type: LRsType;
      if (!removed) {
        type = "added";
      } else if (!added) {
        type = "removed";
      } else if (added.length === removed.length) {
        type = "updated";
      } else {
        type = "replaced";
      }
      if (added.length === removed.length) {
        for (let i = 0; i < added.length; i++) {
          lrs.push({ l: removed[i], r: added[i] });
        }
      } else {
        for (let i = 0; i < removed.length; i++) {
          lrs.push({ l: removed[i], r: null });
        }
        for (let i = 0; i < added.length; i++) {
          lrs.push({ l: null, r: added[i] });
        }
      }
      groups.push({
        type,
        items: lrs
      });
    }
  }
}

export const compareImage: CompareImage = (
  leftFile?: string,
  rightFile?: string
) => {
  const left = leftFile && PNG.sync.read(fs.readFileSync(leftFile));
  const right = rightFile && PNG.sync.read(fs.readFileSync(rightFile));
  let points = [];
  if (left && right) {
    tryHeuristicDiff(leftFile, rightFile);
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
    points
  };
};

type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};
type DiffResultGroup =
  | {
      type: "points";
      dx: number;
      dy: number;
      points: Point[];
    }
  | {
      type: "area";
      left: Area;
      right: Area;
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
  const groups = diffResultToLR(result);
  const diffResultGroups: DiffResultGroup[] = [];
  for (const { type, items } of groups) {
    if (type === "updated") {
      const leftMinX = items[0].l;
      const leftMaxX = items[items.length - 1].l;
      const rightMinX = items[0].r;
      const rightMaxX = items[items.length - 1].r;
      const width = leftMaxX - leftMinX + 1;
      const leftStringArray = stringifyRows(left, leftMinX, leftMaxX);
      const rightStringArray = stringifyRows(right, rightMinX, rightMaxX);
      const result = diff(leftStringArray, rightStringArray);
      const groups = diffResultToLR(result);
      for (const { type, items } of groups) {
        if (type === "updated") {
          const height = items.length;
          const rightMinY = items[0].r;
          const leftMinY = items[0].l;
          const pointsInRect = collectPoints(
            left,
            right,
            width,
            height,
            leftMinX,
            leftMinY,
            rightMinX,
            rightMinY
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
          if (items[0].l) {
            const minY = items[0].l;
            const maxY = items[items.length - 1].l;
            const height = maxY - minY + 1;
            leftArea = { x: leftMinX, y: minY, width, height };
          }
          if (items[0].r) {
            const minY = items[0].r;
            const maxY = items[items.length - 1].r;
            const height = maxY - minY + 1;
            rightArea = { x: leftMinX, y: minY, width, height };
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
      if (items[0].l) {
        const minX = items[0].l;
        const maxX = items[items.length - 1].l;
        const width = maxX - minX + 1;
        leftArea = { x: minX, y: 0, width, height: left.height };
      }
      if (items[0].r) {
        const minX = items[0].r;
        const maxX = items[items.length - 1].r;
        const width = maxX - minX + 1;
        rightArea = { x: minX, y: 0, width, height: left.height };
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

function stringifyRows(png: any, minX: number, maxX: number): string[] {
  const width: number = png.width;
  const height: number = png.height;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = minX; x <= maxX; x++) {
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
  rightMinY: number
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
      if (dr || dg || db) {
        points.push([leftX, leftY]);
      }
    }
  }
  return points;
}
