import "mocha";
import * as assert from "assert";
import * as rectangles from "../src/rectangles";
import { Rect } from "../src/types";

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
  describe("#getRects()", function() {
    const left = {
      path: "",
      width: 10,
      height: 10
    };
    const right = { ...left };
    it("should not throw errors when points are too few", async function() {
      const cases = [[], [[0, 0]], [[0, 0], [9, 9]]];
      for (let points of cases) {
        await rectangles.testGetRects(
          {
            left,
            right,
            points
          },
          4,
          20
        );
      }
    });
  });
});
