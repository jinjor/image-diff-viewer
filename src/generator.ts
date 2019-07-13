import { FileDiff, FileDiffs, Image, Rect } from "./types";
import * as Path from "path";
import * as fs from "fs";

const maxImageWidth = 500;

export function generate(
  files: FileDiffs,
  cssFile: string,
  outPath: string
): string {
  const style = fs.readFileSync(cssFile, "utf8");
  let html = `
<h1>Changes</h1>
<style>
${style}
</style>
`;
  let rows = "";
  for (let file in files) {
    const fileDiff = files[file];
    rows += generateRow(file, fileDiff, outPath);
  }
  if (!rows) {
    html += "<p>No changes.</p>\n";
  }
  html += rows;
  return html;
}

function generateRow(
  file: string,
  fileDiff: FileDiff,
  outPath: string
): string {
  if (fileDiff.type === "unchanged") {
    return "";
  }
  const hash = "#" + encodeURI(file);
  let html = "";
  html += `<a href="${hash}"><h2 class="title">${file}</h2></a>\n`;
  html += `<div class="row ${fileDiff.type}">\n`;
  html += generateColumn(fileDiff.left, fileDiff.rects, outPath);
  html += generateColumn(fileDiff.right, fileDiff.rects, outPath);
  html += `</div>\n`;
  return html;
}

function generateColumn(image: Image, rects: Rect[], outPath: string): string {
  let html = "";
  html += `  <div class="col">\n`;
  if (image) {
    const src = outPath
      ? Path.relative(Path.dirname(outPath), image.path)
      : image.path;
    const width = Math.min(image.width, maxImageWidth);
    const ratio = width / image.width;
    html += `    <div class="image-container">\n`;
    html += `      <img class="image" width="${width}" src="${src}">\n`;
    for (let rect of rects) {
      html += generateRectangle(rect, ratio);
    }
    html += `    </div>\n`;
  }
  html += `  </div>\n`;
  return html;
}

function generateRectangle(rect: Rect, ratio: number): string {
  return `    <div class="rect" style="top: ${rect.top *
    ratio}px; left: ${rect.left * ratio}px; width: ${rect.width *
    ratio}px; height: ${rect.height * ratio}px;"></div>\n`;
}
