import * as fs from "fs";
import { Point, CompareImage } from "./types";
import diff from "wu-diff-js";
import * as crypto from "crypto";

const PNG = require("pngjs").PNG;

type LR = {
  l: number;
  r: number;
};

export function diffResultToLR(result: any): LR[] {
  let l = 0;
  let r = 0;
  let removed = [];
  let added = [];
  const lrs: LR[] = [];
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
  return lrs;

  function addGroupIfNeeded() {
    if (added.length || removed.length) {
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
      mode === "row"
        ? stringifyRows(left, 0, left.width - 1)
        : stringifyColumns(left);
    const rightStringArray =
      mode === "row"
        ? stringifyRows(right, 0, right.width - 1)
        : stringifyColumns(right);
    const result = diff(leftStringArray, rightStringArray);
    const lrs = diffResultToLR(result);
    for (const { l, r } of lrs) {
      if (l !== null && r !== null) {
        mode === "row"
          ? modifyRowColor(left, l, "y")
          : modifyColumnColor(left, l, "y");
        mode === "row"
          ? modifyRowColor(right, r, "y")
          : modifyColumnColor(right, r, "y");
      } else if (l !== null && r === null) {
        mode === "row"
          ? modifyRowColor(left, l, "r")
          : modifyColumnColor(left, l, "r");
      } else if (l === null && r !== null) {
        mode === "row"
          ? modifyRowColor(right, r, "g")
          : modifyColumnColor(right, r, "g");
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
function modifyRowColor(png: any, y: number, color: "r" | "g" | "y"): void {
  for (let x = 0; x < png.width; x++) {
    modifyColor(png, x, y, color);
  }
}
function modifyColumnColor(png: any, x: number, color: "r" | "g" | "y"): void {
  for (let y = 0; y < png.height; y++) {
    modifyColor(png, x, y, color);
  }
}
function modifyColor(
  png: any,
  x: number,
  y: number,
  color: "r" | "g" | "y"
): void {
  let idx = (png.width * y + x) << 2;
  if (color === "r" || color === "y") {
    png.data[idx] = Math.min(255, png.data[idx] * 1.5);
    png.data[idx + 1] = Math.max(0, png.data[idx + 1] * 0.7);
    png.data[idx + 2] = Math.max(0, png.data[idx + 2] * 0.7);
  }
  if (color === "g" || color === "y") {
    png.data[idx] = Math.max(0, png.data[idx] * 0.7);
    png.data[idx + 1] = Math.min(255, png.data[idx + 1] * 1.5);
    png.data[idx + 2] = Math.max(0, png.data[idx + 2] * 0.7);
  }
}
