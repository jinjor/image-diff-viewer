import * as generator from "./generator";
import * as files_ from "./files";
import * as Path from "path";
import { FilePairs, FileDiffs } from "./types";

export interface Options {
  recursive?: boolean;
  output?: string;
  outdir?: string;
  padding?: number;
  clusters?: number;
  css?: string;
}

export async function run(
  left: string,
  right: string,
  options?: Options
): Promise<void> {
  options = {
    recursive: false,
    output: null,
    outdir: null,
    padding: 20,
    clusters: 4,
    css: Path.resolve(__dirname, `../../assets/style.css`),
    ...options
  };
  const advanced = false;
  const threshold = 3;
  const filePairs: FilePairs = options.recursive
    ? files_.getFilePairsRecursively(left, right)
    : files_.getFilePairs(left, right);
  const fileDiffs: FileDiffs = {};
  for (let file in filePairs) {
    const filePair = filePairs[file];
    const fileDiff = await files_.compareFile(
      filePair,
      options.clusters,
      options.padding,
      advanced,
      threshold
    );
    fileDiffs[file] = fileDiff;
  }
  const leftBaseDir = options.recursive ? left : Path.resolve(".");
  const rightBaseDir = options.recursive ? right : Path.resolve(".");
  generator.generate(
    fileDiffs,
    options.css,
    options.output,
    options.outdir,
    leftBaseDir,
    rightBaseDir
  );
}
