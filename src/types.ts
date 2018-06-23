export type Files = { [s: string]: FileDiff };

export interface FileDiff {
  left?: string;
  right?: string;
  change?: FileChange;
}

export type Point = number[];

export class Rect {
  constructor(public left, public top, public right, public bottom) {}
  get width() {
    return this.right - this.left;
  }
  get height() {
    return this.bottom - this.top;
  }
}

export type FileChange = Unchanged | Added | Removed | Updated;
interface Unchanged {
  type: "unchanged";
}
interface Added {
  type: "added";
}
interface Removed {
  type: "removed";
}
interface Updated {
  type: "updated";
  rects: Rect[];
}

export interface ImageChange {
  width: number;
  height: number;
  points: Point[];
}

export type CompareImage = (leftFile: string, rightFile: string) => ImageChange;
