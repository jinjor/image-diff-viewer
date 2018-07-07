import "mocha";
import * as assert from "assert";
import * as fs from "fs";
import * as Path from "path";
import * as puppeteer from "puppeteer";
import * as rectangles from "../src/rectangles";
import * as index from "../src/index";
import { Rect } from "../src/types";

const tmpDir = Path.resolve(__dirname, "../../tmp");
const imageWidth = 600;
const imageHeight = 400;

function createHtml(file: string, marks: number[][]) {
  const rectWidth = 10;
  const rectHeight = 10;
  const interval = 30;
  const rows = imageHeight / interval;
  const cols = imageWidth / interval;
  const dots = [];
  for (let r = 0; r < rows; r++) {
    dots[r] = [];
    for (let c = 0; c < cols; c++) {
      dots[r][c] = {
        top: r * interval,
        left: c * interval,
        colored: false
      };
    }
  }
  for (let mark of marks) {
    const r = mark[0];
    const c = mark[1];
    dots[r][c].colored = true;
  }
  let html = `<style>
    .dots {
        background-color: #eee;
    }
    .dot {
        position:absolute;
        background-color: #ccf;
        width: ${rectWidth}px;
        height: ${rectHeight}px;
    }
    .dot.colored {
        background-color: #fc8;
    }
    </style>
    `;
  html += `<div class="dots">\n`;
  for (let r in dots) {
    const row = dots[r];
    for (let c in row) {
      const dot = row[c];
      const className = dot.colored ? "colored" : "";
      const style = `left: ${dot.left}px; top: ${dot.top}px;`;
      html += `  <div class="dot ${className}" style="${style}"></div>\n`;
    }
  }
  html += `</div>\n`;
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }
  fs.writeFileSync(file, html);
}

async function makeImageFromHtml(
  page: any,
  html: string,
  image: string
): Promise<void> {
  await page.goto(`file://${html}`);
  await page.screenshot({ path: image });
}

describe("index", function() {
  const leftHtml = Path.resolve(tmpDir, "left.html");
  const rightHtml = Path.resolve(tmpDir, "right.html");
  const leftImage = Path.resolve(tmpDir, "left.png");
  const rightImage = Path.resolve(tmpDir, "right.png");
  before(async function() {
    createHtml(leftHtml, [
      [1, 17],
      [2, 17],
      [3, 17],
      [4, 17],
      [5, 17],
      [6, 17]
    ]);
    createHtml(rightHtml, [
      [2, 2],
      [2, 3],
      [3, 11],
      [6, 8],
      [2, 17],
      [3, 17],
      [4, 17],
      [5, 17],
      [6, 17],
      [7, 17]
    ]);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({
      width: imageWidth,
      height: imageHeight
    });
    await makeImageFromHtml(page, leftHtml, leftImage);
    await makeImageFromHtml(page, rightHtml, rightImage);
    await browser.close();
  });
  it("should work", async function() {
    await index.run(leftImage, rightImage, {
      output: Path.resolve(tmpDir, "result.html")
    });
  });
});
describe("rectangles", function() {
  describe("#mergeRect()", function() {
    it("should make a rectangle that contains both inputs", function() {
      const rect = rectangles.testMergeRect(
        new Rect(0, 0, 2, 2),
        new Rect(1, 1, 3, 3)
      );
      assert.equal(rect.top, 0);
      assert.equal(rect.left, 0);
      assert.equal(rect.right, 3);
      assert.equal(rect.bottom, 3);
    });
  });
  describe("#mergeRects()", function() {
    it("should merge all overlapping rectangles", function() {
      const r1 = new Rect(0, 0, 2, 2); // => rect A
      const r2 = new Rect(1, 1, 3, 3); // => rect A
      const r3 = new Rect(4, 4, 5, 5); // => rect B
      const combination = [
        [r1, r2, r3],
        [r1, r3, r2],
        [r2, r1, r3],
        [r2, r3, r1],
        [r3, r1, r2],
        [r3, r2, r1]
      ];
      for (let rects of combination) {
        const newRects = rectangles.testMergeRects(rects);
        assert.equal(newRects.length, 2);
      }
    });
  });
  // describe("#getRects()", function() {
  //   const left = {
  //     path: "",
  //     width: 10,
  //     height: 10
  //   };
  //   const right = { ...left };
  //   it("should not throw errors when points are too few", async function() {
  //     const cases = [[], [[0, 0]], [[0, 0], [9, 9]]];
  //     for (let points of cases) {
  //       await rectangles.testGetRects(
  //         {
  //           left,
  //           right,
  //           points
  //         },
  //         4,
  //         20
  //       );
  //     }
  //   });
  // });
});
