import { FileDiff, FileDiffs, Image, Rect } from "./types";
import * as fs from "fs";

const maxImageWidth = 500;

export function generate(files: FileDiffs, cssFile: string): string {
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
    rows += generateRow(file, fileDiff);
  }
  if (!rows) {
    html += "<p>No changes.</p>\n";
  }
  html += rows;
  return html;
}

function generateRow(file: string, fileDiff: FileDiff): string {
  if (fileDiff.type === "unchanged") {
    return "";
  }
  let html = "";
  html += `<h2 class="title">${file}</h2>\n`;
  html += `<div class="row ${fileDiff.type}">\n`;
  html += generateColumn(fileDiff.left, fileDiff.rects);
  html += generateColumn(fileDiff.right, fileDiff.rects);
  html += `</div>\n`;
  return html;
}

function generateColumn(image: Image, rects: Rect[]): string {
  let html = "";
  html += `  <div class="col">\n`;
  if (image) {
    const width = Math.min(image.width, maxImageWidth);
    const ratio = width / image.width;
    html += `    <div class="image-container">\n`;
    html += `      <img class="image" width="${width}" src="${image.path}">\n`;
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
