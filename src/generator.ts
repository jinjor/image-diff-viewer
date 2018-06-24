import { FileDiff, FileDiffs, Image, Rect } from "./types";
import * as fs from "fs";

export function generate(files: FileDiffs): string {
  const css = `${__dirname}/../assets/style.css`;
  const style = fs.readFileSync(css, "utf8");
  let html = `
<h1>Diff</h1>
<style>
${style}
</style>
`;
  for (let file in files) {
    const fileDiff = files[file];
    html += generateRow(file, fileDiff);
  }
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

const MAX_IMAGE_WIDTH = 500;
function generateColumn(image: Image, rects: Rect[]): string {
  let html = "";
  html += `  <div class="col">`;
  if (image) {
    const width = Math.min(image.width, MAX_IMAGE_WIDTH);
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
