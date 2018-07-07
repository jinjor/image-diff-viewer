import * as clusterizer from "./clusterizer";
import { Rect, ImageChange, Point } from "./types";

export async function getRects(
  change: ImageChange,
  clusters: number,
  padding: number
): Promise<{
  left: Rect[];
  right: Rect[];
}> {
  return await makeRects(change, clusters, padding);
}

async function makeRects(
  change: ImageChange,
  clusters: number,
  padding: number
): Promise<{
  left: Rect[];
  right: Rect[];
}> {
  if (!change.left || !change.right) {
    return {
      left: [],
      right: []
    };
  }
  const leftResults = await clusterizer.run(change.points.left, clusters);
  const rightResults = await clusterizer.run(change.points.right, clusters);
  const width = Math.max(change.left.width, change.right.width);
  const height = Math.max(change.left.height, change.right.height);
  const leftRects = leftResults.map(vectors => {
    return makeRect(width, height, vectors, padding);
  });
  const rightRects = rightResults.map(vectors => {
    return makeRect(width, height, vectors, padding);
  });
  return {
    left: mergeRects(leftRects),
    right: mergeRects(rightRects)
  };
}

function makeRect(
  width: number,
  height: number,
  points: Point[],
  padding: number
): Rect {
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let p of points) {
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  const left = minX - padding;
  const top = minY - padding;
  const right = maxX + padding;
  const bottom = maxY + padding;
  return new Rect(left, top, right, bottom);
}

function isOverlapping(r1: Rect, r2: Rect): boolean {
  return (
    r1.left <= r2.right &&
    r2.left <= r1.right &&
    r1.top <= r2.bottom &&
    r2.top <= r1.bottom
  );
}
function mergeRects(rects: Rect[]): Rect[] {
  while (true) {
    const newRects = mergeRectsOnce(rects);
    if (rects.length === newRects.length) {
      break;
    }
    rects = newRects;
  }
  return rects;
}
function mergeRectsOnce(rects: Rect[]): Rect[] {
  const newRects = [];
  for (let i in rects) {
    const rect = rects[i];
    let merged = false;
    for (let j in newRects) {
      const newRect = newRects[j];
      if (isOverlapping(newRect, rect)) {
        newRects[j] = mergeRect(newRect, rect);
        merged = true;
        break;
      }
    }
    if (!merged) {
      newRects.push(rect);
    }
  }
  return newRects;
}
function mergeRect(r1: Rect, r2: Rect): Rect {
  return new Rect(
    Math.min(r1.left, r2.left),
    Math.min(r1.top, r2.top),
    Math.max(r1.right, r2.right),
    Math.max(r1.bottom, r2.bottom)
  );
}
export const testMergeRects = mergeRects;
export const testMergeRect = mergeRect;
export const testGetRects = getRects;
