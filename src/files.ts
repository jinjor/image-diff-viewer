import * as glob from "glob";
import * as png from "./png";
import * as rectangles from "./rectangles";
import { FilePairs, FilePair, FileDiff } from "./types";

export function getFilePairs(file1: string, file2: string): FilePairs {
  return {
    [`${file1} - ${file2}`]: {
      left: file1,
      right: file2
    }
  };
}

export function getFilePairsRecursively(dir1: string, dir2: string): FilePairs {
  const q = "**/*.{png}";
  const filePairs: FilePairs = {};
  collectFilePairs(filePairs, q, dir1, "left");
  collectFilePairs(filePairs, q, dir2, "right");
  return filePairs;
}

function collectFilePairs(
  filePairs: FilePairs,
  q: string,
  dir: string,
  field: "left" | "right"
): void {
  const files = glob.sync(q, {
    cwd: dir
  });
  for (let file of files) {
    filePairs[file] = filePairs[file] || {};
    filePairs[file][field] = `${dir}/${file}`;
  }
}

export async function compareFile(
  info: FilePair,
  clusters: number,
  padding: number
): Promise<FileDiff> {
  const change = png.compareImage(info.left, info.right);
  let rects = [];
  rects = await rectangles.getRects(change, clusters, padding);
  return new FileDiff(change.left, change.right, rects);
}
