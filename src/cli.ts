#! /usr/bin/env node
import * as index from "./index";
const argv = require("argv");
argv.option({
  name: "recursive",
  short: "r",
  type: "boolean",
  description: ""
});
// deprecated, will be deleted in 2.0
argv.option({
  name: "output",
  short: "o",
  type: "string",
  description: ""
});
// will be "output" in 2.0
argv.option({
  name: "outdir",
  type: "string",
  description: ""
});
argv.option({
  name: "padding",
  type: "number",
  description: ""
});
argv.option({
  name: "clusters",
  type: "number",
  description: ""
});
argv.option({
  name: "css",
  type: "string",
  description: ""
});

const args = argv.run();
index.run(args.targets[0], args.targets[1], args.options).catch(e => {
  console.error(e);
});
