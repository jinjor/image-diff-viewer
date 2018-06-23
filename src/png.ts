import * as fs from "fs";
import { Point, CompareImage } from "./types";

const PNG = require("pngjs").PNG;

export const compareImage: CompareImage = (
  leftFile: string,
  rightFile: string
) => {
  const left = PNG.sync.read(fs.readFileSync(leftFile));
  const right = PNG.sync.read(fs.readFileSync(rightFile));
  const width = Math.max(left.width, right.width);
  const height = Math.max(left.height, right.height);
  const points = collectPoints(left, right, width, height);
  return {
    width,
    height,
    points
  };
};

function collectPoints(
  left: any,
  right: any,
  width: number,
  height: number
): Point[] {
  const points = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const dr = right.data[idx] - left.data[idx];
      const dg = right.data[idx + 1] - left.data[idx + 1];
      const db = right.data[idx + 2] - left.data[idx + 2];
      if (dr || dg || db) {
        points.push({
          x: x,
          y: y
        });
      }
    }
  }
  return points;
}
