import * as generator from "./generator";
import * as files_ from "./files";
import * as fs from "fs";
import { FilePairs, FileDiffs } from "./types";

const argv = require("argv");
argv.option({
  name: "recursive",
  short: "r",
  type: "boolean"
});
argv.option({
  name: "output",
  short: "o",
  type: "string"
});
argv.option({
  name: "padding",
  short: "p",
  type: "number"
});
argv.option({
  name: "clusters",
  short: "c",
  type: "number"
});

run(argv.run()).catch(e => {
  console.error(e);
});

async function run(args): Promise<void> {
  const target1 = args.targets[0];
  const target2 = args.targets[1];
  const padding = args.options.padding || 20;
  const clusters = args.options.clusters || 4;
  const recursive = args.options.recursive || false;
  const output = args.options.output;
  const filePairs: FilePairs = recursive
    ? files_.getFilePairsRecursively(target1, target2)
    : files_.getFilePairs(target1, target2);
  const fileDiffs: FileDiffs = {};
  for (let file in filePairs) {
    const filePair = filePairs[file];
    const fileDiff = await files_.compareFile(filePair, clusters, padding);
    fileDiffs[file] = fileDiff;
  }
  const html = generator.generate(fileDiffs);
  if (output) {
    fs.writeFileSync(output, html);
  } else {
    console.log(html);
  }
}
