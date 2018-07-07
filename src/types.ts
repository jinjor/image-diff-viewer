export type FilePairs = { [s: string]: FilePair };
export type FileDiffs = { [s: string]: FileDiff };

export interface FilePair {
  left?: string;
  right?: string;
}
export type FileDiffType = "removed" | "added" | "updated" | "unchanged";
export class FileDiff {
  constructor(
    public left: Image,
    public right: Image,
    public leftRects: Rect[],
    public rightRects: Rect[]
  ) {}
  get type(): FileDiffType {
    if (this.left && !this.right) {
      return "removed";
    } else if (!this.left && this.right) {
      return "added";
    } else if (this.leftRects.length + this.rightRects.length) {
      return "updated";
    } else {
      return "unchanged";
    }
  }
}

export class Rect {
  constructor(public left, public top, public right, public bottom) {}
  get width() {
    return this.right - this.left;
  }
  get height() {
    return this.bottom - this.top;
  }
}

export interface Image {
  path: string;
  width: number;
  height: number;
}
export interface ImageChange {
  left: Image;
  right: Image;
  points: {
    left: Point[];
    right: Point[];
  };
}
export type Point = number[];

export type CompareImage = (leftFile: string, rightFile: string) => ImageChange;
