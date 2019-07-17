#! /usr/bin/env node
import * as index from "./index";
import * as argv from "argv";

argv.option({
  name: "recursive",
  short: "r",
  type: "boolean",
  description: "Compare all files in a directory"
});
// deprecated, will be deleted in 2.0
argv.option({
  name: "output",
  short: "o",
  type: "string",
  description: "The output HTML file (deprecated, use --outdir instead)"
});
// will be "output" in 2.0
argv.option({
  name: "outdir",
  type: "string",
  description: "The output directory"
});
argv.option({
  name: "padding",
  type: "number",
  description: "Determins the rectangle size (default = 20)"
});
argv.option({
  name: "threshold",
  type: "number",
  description:
    "Recognizes differences if color difference exceeds threshold (default = 0)"
});
argv.option({
  name: "clusters",
  type: "number",
  description: "Determins the number of clusters (default = 4)"
});
argv.option({
  name: "css",
  type: "string",
  description: "Uses your custom CSS file"
});
argv.option({
  name: "shift-aware",
  type: "boolean",
  description:
    "(experimental) Uses the different algorithm to detect Y-direction shift"
});
argv.option({
  name: "ignore-spacing",
  type: "boolean",
  description:
    "Ignores added/removed areas where all colors are the same (works with --shift-aware)"
});
argv.option({
  name: "verbose",
  short: "v",
  type: "boolean",
  description: "Outputs verbose logs"
});

const args = argv.run();

function rename(oldName: string, newName: string) {
  args.options[newName] = args.options[oldName];
  delete args.options[oldName];
}
rename("shift-aware", "shiftAware");
rename("ignore-spacing", "ignoreSpacing");

index.run(args.targets[0], args.targets[1], args.options).catch(e => {
  console.error(e);
});
