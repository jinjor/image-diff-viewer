import * as fs from "fs";
import { Point, CompareImage } from "./types";
import diff from "wu-diff-js";
import * as crypto from "crypto";

const PNG = require("pngjs").PNG;

export const compareImage: CompareImage = (
  leftFile?: string,
  rightFile?: string
) => {
  const left = leftFile && PNG.sync.read(fs.readFileSync(leftFile));
  const right = rightFile && PNG.sync.read(fs.readFileSync(rightFile));
  let points = [];
  if (left && right) {
    trySimpleDiff(leftFile, rightFile, "row");
    trySimpleDiff(leftFile, rightFile, "column");
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

function trySimpleDiff(
  leftFile: string,
  rightFile: string,
  mode: "row" | "column"
) {
  const left = leftFile && PNG.sync.read(fs.readFileSync(leftFile));
  const right = rightFile && PNG.sync.read(fs.readFileSync(rightFile));
  if (left && right) {
    const leftStringArray =
      mode === "row" ? stringifyRows(left) : stringifyColumns(left);
    const rightStringArray =
      mode === "row" ? stringifyRows(right) : stringifyColumns(right);
    const result = diff(leftStringArray, rightStringArray);
    let leftIndex = 0;
    let rightIndex = 0;
    let inGroup = false;
    for (const r of result) {
      if (r.type === "added") {
        mode === "row"
          ? modifyRowColor(right, rightIndex, "g")
          : modifyColumnColor(right, rightIndex, "g");
        inGroup = true;
        rightIndex++;
        // console.log(leftIndex, rightIndex, r);
      } else if (r.type === "removed") {
        mode === "row"
          ? modifyRowColor(left, leftIndex, "r")
          : modifyColumnColor(left, leftIndex, "r");
        inGroup = true;
        leftIndex++;
        // console.log(leftIndex, rightIndex, r);
      } else {
        rightIndex++;
        leftIndex++;
        if (inGroup) {
          // console.log();
        }
        inGroup = false;
        // console.log(leftIndex, rightIndex, r);
      }
    }
    {
      const buffer = PNG.sync.write(left, { colorType: 6 });
      fs.writeFileSync(`work/out-${mode}-before.png`, buffer);
    }
    {
      const buffer = PNG.sync.write(right, { colorType: 6 });
      fs.writeFileSync(`work/out-${mode}-after.png`, buffer);
    }
  }
}

function stringifyRows(png: any): string[] {
  const width: number = png.width;
  const height: number = png.height;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
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
function modifyRowColor(png: any, y: number, color: "r" | "g"): void {
  for (let x = 0; x < png.width; x++) {
    modifyColor(png, x, y, color);
  }
}
function modifyColumnColor(png: any, x: number, color: "r" | "g"): void {
  for (let y = 0; y < png.height; y++) {
    modifyColor(png, x, y, color);
  }
}
function modifyColor(png: any, x: number, y: number, color: "r" | "g"): void {
  let idx = (png.width * y + x) << 2;
  if (color === "r") {
    png.data[idx] = Math.min(255, png.data[idx] * 1.5);
    png.data[idx + 1] = Math.max(0, png.data[idx + 1] * 0.7);
    png.data[idx + 2] = Math.max(0, png.data[idx + 2] * 0.7);
  } else if (color === "g") {
    png.data[idx] = Math.max(0, png.data[idx] * 0.7);
    png.data[idx + 1] = Math.min(255, png.data[idx + 1] * 1.5);
    png.data[idx + 2] = Math.max(0, png.data[idx + 2] * 0.7);
  }
}