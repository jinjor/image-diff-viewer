import * as generator from "./generator";
import * as files_ from "./files";
import * as fs from "fs";

const argv = require("argv");
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
  const dir1 = args.targets[0];
  const dir2 = args.targets[1];
  const padding = args.options.padding || 20;
  const clusters = args.options.clusters || 4;
  const output = args.options.output;
  const files = files_.getFiles(dir1, dir2);
  for (let file in files) {
    const info = files[file];
    const change = await files_.compareFile(info, clusters, padding);
    info.change = change;
  }
  const html = generator.generate(files);
  if (output) {
    fs.writeFileSync(output, html);
  } else {
    console.log(html);
  }
}
