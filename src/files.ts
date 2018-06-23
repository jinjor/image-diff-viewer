import * as glob from "glob";
import * as png from "./png";
import * as rectangles from "./rectangles";
import { Files, FileDiff, FileChange } from "./types";

export function getFiles(dir1: string, dir2: string): Files {
  const pngs1 = glob.sync("**/*.png", {
    cwd: dir1
  });
  const pngs2 = glob.sync("**/*.png", {
    cwd: dir2
  });
  const files: Files = {};
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
  info: FileDiff,
  clusters: number,
  padding: number
): Promise<FileChange> {
  if (info.left && !info.right) {
    return { type: "removed" };
  }
  if (!info.left && info.right) {
    return { type: "added" };
  }
  const imageChange = png.compareImage(info.left, info.right);
  if (!imageChange.points.length) {
    return {
      type: "unchanged"
    };
  }
  const rects = await rectangles.getRects(imageChange, clusters, padding);
  return {
    type: "updated",
    rects: rects
  };
}
