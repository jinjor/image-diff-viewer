export type FilePairs = { [s: string]: FilePair };
export type FileDiffs = { [s: string]: FileDiff };

export interface FilePair {
  left?: string;
  right?: string;
}
export type FileDiffType = "removed" | "added" | "updated" | "unchanged";
export class FileDiff {
  constructor(
    public left: ImageMetaInfo,
    public right: ImageMetaInfo,
    public rects: RectsLR
  ) {}
  get type(): FileDiffType {
    if (this.left && !this.right) {
      return "removed";
    } else if (!this.left && this.right) {
      return "added";
    } else if (this.rects.left.length + this.rects.right.length) {
      return "updated";
    } else {
      return "unchanged";
    }
  }
}
export type RectsLR = {
  left: Rect[];
  right: Rect[];
};
export class Rect {
  constructor(public left, public top, public right, public bottom) {}
  get width() {
    return this.right - this.left;
  }
  get height() {
    return this.bottom - this.top;
  }
  shift(dx: number, dy: number): Rect {
    return new Rect(
      this.left + dx,
      this.top + dy,
      this.right + dx,
      this.bottom + dy
    );
  }
}

export type Point = number[];

export type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type DiffResultGroup =
  | {
      type: "points";
      dx: number;
      dy: number;
      points: Point[];
    }
  | {
      type: "area";
      left: Area;
      right: Area;
    };
export interface ImageMetaInfo {
  path: string;
  width: number;
  height: number;
}
export interface ImageChange {
  left: ImageMetaInfo;
  right: ImageMetaInfo;
  results: DiffResultGroup[];
}
export type CompareImage = (leftFile: string, rightFile: string) => ImageChange;

export interface Image {
  width: number;
  height: number;
  save(path: string): Promise<void>;
  getPixel(x: number, y: number): number[];
  setPixel(x: number, y: number, r: number, g: number, b: number): void;
}
