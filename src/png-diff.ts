import { Point, CompareImage, DiffResultGroup, Area, Image } from "./types";
import * as crypto from "crypto";
import { Png } from "./png";
import { diff } from "./diff";

export const compareImage: CompareImage = (
  leftFile?: string,
  rightFile?: string
) => {
  const advanced = false;
  const threshold = 3;
  const left: Image = leftFile && new Png(leftFile);
  const right: Image = rightFile && new Png(rightFile);
  let diffResultGroups = [];
  if (left && right) {
    if (advanced) {
      diffResultGroups = runAdvanced(left, right, threshold);
    } else {
      diffResultGroups = runSimple(left, right, threshold);
    }
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

function runSimple(
  left: Image,
  right: Image,
  threshold: number
): DiffResultGroup[] {
  const width = Math.max(left.width, right.width);
  const height = Math.max(left.height, right.height);
  const points = collectPoints(
    left,
    right,
    width,
    height,
    0,
    0,
    0,
    0,
    threshold
  );
  return [
    {
      type: "points",
      dx: 0,
      dy: 0,
      points
    }
  ];
}

function runAdvanced(
  left: Image,
  right: Image,
  threshold: number
): DiffResultGroup[] {
  if (!left || !right) {
    return null;
  }
  const leftStringArray = stringifyColumns(left);
  const rightStringArray = stringifyColumns(right);
  console.log(left.width, right.width);
  const groups = diff(leftStringArray, rightStringArray);
  const diffResultGroups: DiffResultGroup[] = [];
  for (const group of groups) {
    // console.log("col", group.type, group.left, group.right);
    if (group.type === "updated") {
      const leftMinX = group.left.min;
      const rightMinX = group.right.min;
      const width = group.left.length;
      const leftStringArray = stringifyRows(left, leftMinX, width);
      const rightStringArray = stringifyRows(right, rightMinX, width);
      const groups = diff(leftStringArray, rightStringArray);
      for (const group of groups) {
        // console.log("  row", group.type, group.left, group.right);
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
            threshold
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
  left: Image,
  right: Image,
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
  left.save(`work/out-heulistic-before.png`);
  right.save(`work/out-heulistic-after.png`);
}

function stringifyRows(png: Image, minX: number, areaWidth: number): string[] {
  const height = png.height;
  const rows = [];
  const hash = crypto.createHash("md5");
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = minX; x < minX + areaWidth; x++) {
      const [r, g, b] = png.getPixel(x, y);
      row += `${r},${g},${b}`;
    }
    hash.update(row);
    rows.push(hash.digest("hex"));
  }
  return rows;
}

function stringifyColumns(png: Image): string[] {
  const width = png.width;
  const height = png.height;
  const cols = [];
  const hash = crypto.createHash("md5");
  for (let x = 0; x < width; x++) {
    let col = "";
    for (let y = 0; y < height; y++) {
      const [r, g, b] = png.getPixel(x, y);
      col += `${r},${g},${b}`;
    }
    hash.update(col);
    cols.push(hash.digest("hex"));
  }
  return cols;
}
function modifyAreaColor(
  png: Image,
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
  png: Image,
  x: number,
  y: number,
  color: "r" | "g" | "y" | "fill"
): void {
  let idx = (png.width * y + x) << 2;
  let [r, g, b] = png.getPixel(x, y);
  if (color === "r") {
    r = Math.min(255, r * 1.5);
    g = Math.max(0, g * 0.7);
    b = Math.max(0, b * 0.7);
  } else if (color === "g") {
    r = Math.max(0, r * 0.7);
    g = Math.min(255, g * 1.5);
    b = Math.max(0, b * 0.7);
  } else if (color === "y") {
    r = Math.min(255, r * 1.5);
    g = Math.min(255, g * 1.5);
    b = Math.max(0, b * 0.7);
  } else if (color === "fill") {
    r = 255;
    g = 0;
    b = 0;
  }
  png.setPixel(x, y, r, g, b);
}

function collectPoints(
  left: Image,
  right: Image,
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
      const rightX = rightMinX + x;
      const rightY = rightMinY + y;
      const pl = left.getPixel(leftX, leftY);
      const pr = right.getPixel(rightX, rightY);
      if (!pl || !pr) {
        points.push([leftX, leftY]);
        continue;
      }
      if (
        Math.abs(pr[0] - pl[0]) > threshold ||
        Math.abs(pr[1] - pl[1]) > threshold ||
        Math.abs(pr[2] - pl[2]) > threshold
      ) {
        points.push([leftX, leftY]);
      }
    }
  }
  return points;
}
