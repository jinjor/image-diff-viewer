const kmeans = require("node-kmeans");

export function run(points: any[], clusters: number): Promise<any> {
  const vectors = points.map(point => {
    return [point.x, point.y];
  });
  return new Promise((resolve, reject) => {
    kmeans.clusterize(vectors, { k: clusters }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
