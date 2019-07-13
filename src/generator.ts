import { FileDiff, FileDiffs, Image, Rect } from "./types";
import * as Path from "path";
import * as fs from "fs";
import * as rimraf from "rimraf";

const maxImageWidth = 500;

export function generate(
  fileDiffs: FileDiffs,
  cssFile: string,
  outPath: string,
  outDir: string,
  leftBaseDir: string,
  rightBaseDir: string
): void {
  outPath = outPath || (outDir && Path.join(outDir, "index.html"));
  const html = generateHtml(
    fileDiffs,
    cssFile,
    outPath,
    outDir,
    leftBaseDir,
    rightBaseDir
  );
  if (outDir) {
    copyFiles(fileDiffs, cssFile, leftBaseDir, rightBaseDir, outDir);
  }
  if (outPath) {
    fs.writeFileSync(outPath, html);
  } else {
    console.log(html);
  }
}

function copyFiles(
  fileDiffs: FileDiffs,
  cssFile: string,
  leftBaseDir: string,
  rightBaseDir: string,
  outDir: string
) {
  if (fs.existsSync(outDir)) {
    rimraf.sync(outDir);
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.copyFileSync(cssFile, Path.join(outDir, "style.css"));
  for (const key in fileDiffs) {
    const fileDiff = fileDiffs[key];
    if (fileDiff.left) {
      copyFile(fileDiff.left.path, leftBaseDir, Path.join(outDir, "left"));
    }
    if (fileDiff.right) {
      copyFile(fileDiff.right.path, rightBaseDir, Path.join(outDir, "right"));
    }
  }
}

function copyFile(filePath: string, baseDir: string, outDir: string): void {
  const path = Path.join(outDir, Path.relative(baseDir, filePath));
  fs.mkdirSync(Path.dirname(path), { recursive: true });
  fs.copyFileSync(filePath, path);
}

function generateHtml(
  fileDiffs: FileDiffs,
  cssFile: string,
  outPath: string,
  outDir: string,
  leftBaseDir: string,
  rightBaseDir: string
): string {
  let styleTag;
  if (outDir) {
    styleTag = `<link rel="stylesheet" href="style.css">`;
  } else {
    styleTag = `<style>${fs.readFileSync(cssFile, "utf8")}</style>`;
  }
  let html = `
${styleTag}
<h1>Changes</h1>
`;
  let rows = "";
  for (let key in fileDiffs) {
    const fileDiff = fileDiffs[key];
    rows += generateRow(
      key,
      fileDiff,
      outPath,
      outDir,
      leftBaseDir,
      rightBaseDir
    );
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
  outPath: string,
  outDirPath: string,
  leftBaseDir: string,
  rightBaseDir: string
): string {
  if (fileDiff.type === "unchanged") {
    return "";
  }
  const hash = "#" + encodeURI(file);
  let html = "";
  html += `<a href="${hash}"><h2 class="title">${file}</h2></a>\n`;
  html += `<div class="row ${fileDiff.type}">\n`;
  html += generateColumn(
    fileDiff.left,
    fileDiff.rects,
    outPath,
    outDirPath,
    outDirPath ? "left" : null,
    leftBaseDir
  );
  html += generateColumn(
    fileDiff.right,
    fileDiff.rects,
    outPath,
    outDirPath,
    outDirPath ? "right" : null,
    rightBaseDir
  );
  html += `</div>\n`;
  return html;
}

function generateColumn(
  image: Image,
  rects: Rect[],
  outPath: string,
  outDirPath: string,
  subDir: "left" | "right" | null,
  baseDir: string
): string {
  let html = "";
  html += `  <div class="col">\n`;
  if (image) {
    const src = outDirPath
      ? subDir + "/" + Path.relative(baseDir, image.path)
      : outPath
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
