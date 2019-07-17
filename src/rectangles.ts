import * as clusterizer from "./clusterizer";
import { Rect, ImageChange, Point, RectsLR } from "./types";

export async function getRects(
  change: ImageChange,
  numberOfClusters: number,
  padding: number
): Promise<RectsLR> {
  if (!change.left || !change.right) {
    return { left: [], right: [] };
  }
  const width = Math.max(change.left.width, change.right.width);
  const height = Math.max(change.left.height, change.right.height);
  const left = [];
  const right = [];
  const allPoints: {
    [key: string]: { dx: number; dy: number; points: Point[] };
  } = {};

  for (const result of change.results) {
    if (result.type === "points") {
      const key = result.dx + "_" + result.dy;
      allPoints[key] = allPoints[key] || {
        dx: result.dx,
        dy: result.dy,
        points: []
      };
      for (const p of result.points) {
        allPoints[key].points.push(p);
      }
    } else {
      if (result.left) {
        const { x, y, width, height } = result.left;
        left.push(new Rect(x, y, x + width, y + height));
      }
      if (result.right) {
        const { x, y, width, height } = result.right;
        right.push(new Rect(x, y, x + width, y + height));
      }
    }
  }
  for (const key in allPoints) {
    const result = allPoints[key];
    const clusters = await clusterizer.run(result.points, numberOfClusters);
    const overlappingRects = clusters.map(vectors => {
      return makeRect(width, height, vectors, padding);
    });
    const leftRects = mergeRects(overlappingRects);
    const rightRects = leftRects.map(r => {
      return r.shift(result.dx, result.dy);
    });
    left.push(...leftRects);
    right.push(...rightRects);
  }
  return { left, right };
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
  const newRects: Rect[] = [];
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    let merged = false;
    for (let j = 0; j < newRects.length; j++) {
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
