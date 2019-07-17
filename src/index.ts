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
  shiftAware?: boolean;
  threshold?: number;
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
    shiftAware: false,
    threshold: 0,
    ...options
  };
  console.log("options:");
  console.log("  recursive   :", options.recursive);
  console.log("  output      :", options.output);
  console.log("  outdir      :", options.outdir);
  console.log("  padding     :", options.padding);
  console.log("  clusters    :", options.clusters);
  console.log("  css         :", options.css);
  console.log("  shift-aware :", options.shiftAware);
  console.log("  threshold   :", options.threshold);
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
      options.shiftAware,
      options.threshold
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
