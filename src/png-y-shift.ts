import * as fs from "fs";
import { Point, CompareImage } from "./types";
import * as diff from "diff";

const PNG = require("pngjs").PNG;

export const compareImage: CompareImage = (
  leftFile?: string,
  rightFile?: string
) => {
  const left = leftFile && PNG.sync.read(fs.readFileSync(leftFile));
  const right = rightFile && PNG.sync.read(fs.readFileSync(rightFile));
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
  let points = {
    left: [],
    right: []
  };
  if (left && right) {
    const width = Math.max(left.width, right.width);
    const height = Math.max(left.height, right.height);
    points = collectPoints(left, right, width, height);
  }
  return {
    left: leftInfo,
    right: rightInfo,
    points
  };
};

function collectPoints(
  left: any,
  right: any,
  width: number,
  height: number
): {
  left: Point[];
  right: Point[];
} {
  const leftPoints = [];
  const rightPoints = [];
  for (let x = 0; x < width; x++) {
    const leftCol = new Array(height);
    const rightCol = new Array(height);
    for (let y = 0; y < height; y++) {
      const idx = (width * y + x) << 2;
      leftCol[y] =
        (left.data[idx] << 16) + (left.data[idx + 1] << 8) + left.data[idx + 2];
      rightCol[y] =
        (right.data[idx] << 16) +
        (right.data[idx + 1] << 8) +
        right.data[idx + 2];
    }
    let leftY = 0;
    let rightY = 0;
    for (let d of diff.diffArrays(leftCol, rightCol)) {
      for (let i = 0; i < d.count; i++) {
        if (d.added) {
          rightPoints.push([x, leftY]);
        }
        if (d.removed) {
          leftPoints.push([x, rightY]);
        }
        if (!d.added) {
          leftY++;
        }
        if (!d.removed) {
          rightY++;
        }
      }
    }
  }
  return {
    left: leftPoints,
    right: rightPoints
  };
}
