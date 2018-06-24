import * as glob from "glob";
import * as png from "./png";
import * as rectangles from "./rectangles";
import { FilePairs, FilePair, FileDiff } from "./types";

export function getFilePairs(dir1: string, dir2: string): FilePairs {
  const pngs1 = glob.sync("**/*.png", {
    cwd: dir1
  });
  const pngs2 = glob.sync("**/*.png", {
    cwd: dir2
  });
  const files: FilePairs = {};
  for (let file of pngs1) {
    files[file] = files[file] || {};
    files[file].left = `${dir1}/${file}`;
  }
  for (let file of pngs2) {
    files[file] = files[file] || {};
    files[file].right = `${dir2}/${file}`;
  }
  return files;
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
