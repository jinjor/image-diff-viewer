import * as generator from "./generator";
import * as files_ from "./files";
import * as fs from "fs";
import * as Path from "path";
import { FilePairs, FileDiffs } from "./types";

const defaultOptions = {
  recursive: false,
  output: null,
  padding: 20,
  clusters: 4,
  css: Path.resolve(__dirname, `../../assets/style.css`)
};

export async function run(
  left: string,
  right: string,
  options?: any
): Promise<void> {
  options = Object.assign(defaultOptions, options);
  const filePairs: FilePairs = options.recursive
    ? files_.getFilePairsRecursively(left, right)
    : files_.getFilePairs(left, right);
  const fileDiffs: FileDiffs = {};
  for (let file in filePairs) {
    const filePair = filePairs[file];
    const fileDiff = await files_.compareFile(
      filePair,
      options.clusters,
      options.padding
    );
    fileDiffs[file] = fileDiff;
  }
  const html = generator.generate(fileDiffs, options.css, options.output);
  if (options.output) {
    fs.writeFileSync(options.output, html);
  } else {
    console.log(html);
  }
}
