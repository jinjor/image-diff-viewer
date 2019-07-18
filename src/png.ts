import * as fs from "fs";
import { Image } from "./types";

const PNG = require("pngjs").PNG;

export class Png implements Image {
  private png: any;
  constructor(public path: string) {
    this.png = PNG.sync.read(fs.readFileSync(this.path));
  }
  get width(): number {
    return this.png.width;
  }
  get height(): number {
    return this.png.height;
  }
  async save(path: string): Promise<void> {
    // TODO: async
    const buffer = PNG.sync.write(this.png, { colorType: 6 });
    fs.writeFileSync(path, buffer);
  }
  getPixel(x: number, y: number): number[] {
    const i = (this.png.width * y + x) << 2;
    const data = this.png.data;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r === undefined || g === undefined || b === undefined) {
      return null;
    }
    return [r, g, b];
  }
  setPixel(x: number, y: number, r: number, g: number, b: number): void {
    const i = (this.png.width * y + x) << 2;
    const data = this.png.data;
    if (r !== null) {
      data[i] = r;
    }
    if (g !== null) {
      data[i + 1] = g;
    }
    if (b !== null) {
      data[i + 2] = b;
    }
  }
}
