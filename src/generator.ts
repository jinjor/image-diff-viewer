import { FileDiff, FileChange, Files } from "./types";

export function generate(files: Files): string {
  let html = `
<h1>Diff</h1>
<style>
.row {
  display: flex;
  transform: scale(.5);
  transform-origin: top left;
}
.title {}
.image-container {
  position: relative;
}
.rect {
  position: absolute;
  border: solid 2px red;
}
</style>
`;
  for (let file in files) {
    const info = files[file];
    html += generateRow(file, info);
  }
  return html;
}

function generateRow(file: string, info: FileDiff): string {
  if (info.change.type === "unchanged") {
    return "";
  }
  let html = "";
  html += `<div class="title">${file}</div>\n`;
  html += `<div class="row">\n`;
  html += generateColumn(info.left, info.change);
  html += generateColumn(info.right, info.change);
  html += `</div>\n`;
  return html;
}

function generateColumn(src: string, change: FileChange): string {
  let html = "";
  html += `  <div class="col image-container">\n`;
  html += `    <img class="image" src="${src}">\n`;
  if (change.type === "updated") {
    for (let rect of change.rects) {
      html += generateRectangle(rect);
    }
  }
  html += `  </div>\n`;
  return html;
}

function generateRectangle(rect): string {
  if (!rect) {
    return "";
  }
  return `    <div class="rect" style="top: ${rect.top}px; left: ${
    rect.left
  }px; width: ${rect.width}px; height: ${rect.height}px;"></div>\n`;
}
