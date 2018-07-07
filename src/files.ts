import * as Path from "path";
import * as glob from "glob";
import * as png from "./png-y-shift";
import * as rectangles from "./rectangles";
import { FilePairs, FilePair, FileDiff } from "./types";

export function getFilePairs(file1: string, file2: string): FilePairs {
  const name1 = `${Path.relative(".", file1)}`;
  const name2 = `${Path.relative(".", file2)}`;
  return {
    [`${name1} - ${name2}`]: {
      left: file1,
      right: file2
    }
  };
}

export function getFilePairsRecursively(dir1: string, dir2: string): FilePairs {
  const pattern = "**/*.png";
  const filePairs: FilePairs = {};
  collectFilePairs(filePairs, pattern, dir1, "left");
  collectFilePairs(filePairs, pattern, dir2, "right");
  return filePairs;
}

function collectFilePairs(
  filePairs: FilePairs,
  pattern: string,
  dir: string,
  field: "left" | "right"
): void {
  const files = glob.sync(pattern, {
    cwd: dir
  });
  for (let file of files) {
    filePairs[file] = filePairs[file] || {};
    filePairs[file][field] = Path.resolve(dir, file);
  }
}

export async function compareFile(
  info: FilePair,
  clusters: number,
  padding: number
): Promise<FileDiff> {
  const change = png.compareImage(info.left, info.right);
  const rects = await rectangles.getRects(change, clusters, padding);
  return new FileDiff(change.left, change.right, rects.left, rects.right);
}
