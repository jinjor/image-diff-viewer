import { FileDiff, FileDiffs, Rect, Paths } from "./types";
import * as Path from "path";
import * as fs from "fs";
import * as rimraf from "rimraf";

const maxImageWidth = 500;

export function generate(fileDiffs: FileDiffs, paths: Paths): void {
  const html = generateHtml(fileDiffs, paths);
  if (paths.outDir) {
    copyFiles(fileDiffs, paths);
  }
  if (paths.outHtml) {
    fs.writeFileSync(paths.outHtml, html);
  } else {
    console.log(html);
  }
}

function copyFiles(fileDiffs: FileDiffs, paths: Paths) {
  if (fs.existsSync(paths.outDir)) {
    rimraf.sync(paths.outDir);
  }
  fs.mkdirSync(paths.outDir, { recursive: true });
  fs.copyFileSync(paths.srcCss, Path.join(paths.outDir, "style.css"));
  for (const key in fileDiffs) {
    const fileDiff = fileDiffs[key];
    if (fileDiff.left) {
      copyFile(
        fileDiff.left.path,
        paths.leftBaseDir,
        Path.join(paths.outDir, "left")
      );
    }
    if (fileDiff.right) {
      copyFile(
        fileDiff.right.path,
        paths.rightBaseDir,
        Path.join(paths.outDir, "right")
      );
    }
  }
}

function copyFile(filePath: string, baseDir: string, outDir: string): void {
  const path = Path.join(outDir, Path.relative(baseDir, filePath));
  fs.mkdirSync(Path.dirname(path), { recursive: true });
  fs.copyFileSync(filePath, path);
}

function generateHtml(fileDiffs: FileDiffs, paths: Paths): string {
  let styleTag;
  if (paths.outDir) {
    styleTag = `<link rel="stylesheet" href="style.css">`;
  } else {
    styleTag = `<style>${fs.readFileSync(paths.srcCss, "utf8")}</style>`;
  }
  let html = `
${styleTag}
<script src="https://bundle.run/pixelmatch"></script>
<h1>Changes</h1>
`;
  let rows = "";
  for (let key in fileDiffs) {
    const fileDiff = fileDiffs[key];
    rows += generateRow(key, fileDiff, paths);
  }
  if (!rows) {
    html += "<p>No changes.</p>\n";
  }
  html += rows;
  return html;
}

function generateRow(file: string, fileDiff: FileDiff, paths: Paths): string {
  if (fileDiff.type === "unchanged") {
    return "";
  }
  const hash = "#" + encodeURI(file);
  let html = "";
  html += `<a href="${hash}"><h2 class="title">${file}</h2></a>\n`;
  html += `<div class="row ${fileDiff.type}">\n`;
  html += generateColumn(fileDiff, "left", paths);
  html += generateColumn(fileDiff, "right", paths);
  html += `</div>\n`;
  html += `
  <script>
  var canvas = document.createElement('canvas');

  var ctx = canvas.getContext('2d');

  function getImageAsImageData(imageObj) {
    return new Promise((resolve) => {
      var canvas = document.createElement('canvas');

      var context = canvas.getContext('2d');

      imageObj.onload = function () {
        const { width, height } = imageObj;
        canvas.width = width;
        canvas.height = height;

        context.drawImage(imageObj, 0, 0, width, height);
        imgData = context.getImageData(0, 0, width, height);
        canvas.width = 1;
        canvas.height = 1;

        resolve(imgData);
      };
      const src = imageObj.src;
      imageObj.src = '';
      imageObj.src = src;
    });
  }

  document.querySelectorAll('.row').forEach((rowEl) => {
    const images = rowEl.querySelectorAll('img');
    if (!images.length === 2) {
      return;
    }




    Promise.all(
      [
        getImageAsImageData(images[0]),
        getImageAsImageData(images[1]),
      ]
    ).then(([img1, img2]) => {
      const { width, height } = images[1] || images[0];
      const newCol = document.createElement('div');
      newCol.classList.add('col');
      newCol.innerHTML = '<div class="image-container"><canvas /></div>';
      rowEl.appendChild(newCol);

      const diffCanvas = rowEl.querySelector('canvas');
      diffCanvas.width = width;
      diffCanvas.height = height;
      const diffContext = diffCanvas.getContext('2d');

      const diff = ctx.createImageData(width, height);
      pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
      diffContext.putImageData(diff, 0, 0);
    });
  });
</script>
`
  return html;
}

function makeSrc(
  which: "left" | "right",
  fileDiff: FileDiff,
  paths: Paths
): string {
  const imagePath = fileDiff[which].path;
  const baseDir = which === "left" ? paths.leftBaseDir : paths.rightBaseDir;
  return paths.outDir
    ? which + "/" + Path.relative(baseDir, imagePath)
    : paths.outHtml
    ? Path.relative(Path.dirname(paths.outHtml), imagePath)
    : imagePath;
}

function generateColumn(
  fileDiff: FileDiff,
  which: "left" | "right",
  paths: Paths
): string {
  const image = fileDiff[which];
  const rects = fileDiff.rects[which];
  let html = "";
  html += `  <div class="col">\n`;
  if (image) {
    const src = makeSrc(which, fileDiff, paths);
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
