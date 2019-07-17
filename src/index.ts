import * as generator from "./generator";
import * as files_ from "./files";
import * as Path from "path";
import { FilePairs, FileDiffs, Options, Paths } from "./types";
import { Logger } from "./logger";

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
    ignoreSpacing: true,
    verbose: false,
    ...options
  };
  const logger = new Logger(options.verbose);
  logger.verbose("options:");
  logger.verbose("  recursive      :", options.recursive);
  logger.verbose("  output         :", options.output);
  logger.verbose("  outdir         :", options.outdir);
  logger.verbose("  padding        :", options.padding);
  logger.verbose("  clusters       :", options.clusters);
  logger.verbose("  css            :", options.css);
  logger.verbose("  shift-aware    :", options.shiftAware);
  logger.verbose("  threshold      :", options.threshold);
  logger.verbose("  ignore-spacing :", options.ignoreSpacing);
  logger.verbose("  verbose        :", options.verbose);
  const filePairs: FilePairs = options.recursive
    ? files_.getFilePairsRecursively(left, right)
    : files_.getFilePairs(left, right);
  const fileDiffs: FileDiffs = {};
  for (let file in filePairs) {
    const filePair = filePairs[file];
    const fileDiff = await files_.compareFile(filePair, options, logger);
    fileDiffs[file] = fileDiff;
  }
  const leftBaseDir = options.recursive ? left : Path.resolve(".");
  const rightBaseDir = options.recursive ? right : Path.resolve(".");
  generator.generate(
    fileDiffs,
    new Paths(
      options.css,
      options.outdir,
      options.output,
      leftBaseDir,
      rightBaseDir
    )
  );
}
