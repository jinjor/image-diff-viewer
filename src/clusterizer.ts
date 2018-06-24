import { Point } from "./types";
const kmeans = require("node-kmeans");

export async function run(
  points: Point[],
  clusters: number
): Promise<Point[][]> {
  if (!points.length) {
    return [];
  }
  const results = await clusterize(points, clusters);
  return results.map(result => result.cluster);
}

function clusterize(points: Point[], clusters: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    kmeans.clusterize(points, { k: clusters }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
