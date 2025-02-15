import { parseArgs } from "node:util";
import type { CLIOptions, CPPaths } from "./types";
import { Logger } from "./Logger";
import { join, resolve } from "node:path";

export class Options {
  packageName: string;
  private readonly options: CPPaths;
  public readonly CWD = process.cwd();
  constructor() {
    const { values } = parseArgs({
      options: {
        name: { type: "string", short: "n", multiple: false },
        aliasOnly: { type: "boolean", short: "a", multiple: false },
        destination: { type: "string", short: "d", multiple: false },
        tsConfigPath: { type: "string", short: "t", multiple: false },
        babelConfigPath: { type: "string", short: "b", multiple: false },
        packageTemplatePath: { type: "string", short: "p", multiple: false },
      },
    });
    this.options = this.parsePaths(values);
    const { name } = values;
    if (!name || name.trim().length < 3) {
      Logger.info("The --name flag is required");
      process.exit(0);
    }
    this.packageName = name.trim();
  }

  public get<K extends keyof CPPaths>(key: K): CPPaths[K] {
    return this.options[key];
  }

  private parsePaths(options: CLIOptions) {
    const {
      aliasOnly,
      destination,
      tsConfigPath,
      babelConfigPath,
      packageTemplatePath,
    } = options;
    return {
      aliasOnly,
      tsConfigPath: this.toAbsolutePath(
        tsConfigPath,
        join(this.CWD, "tsconfig.json"),
      )!,
      babelConfigPath: this.toAbsolutePath(
        babelConfigPath,
        join(this.CWD, "babel.config.js"),
      )!,
      destination: this.toAbsolutePath(destination, undefined),
      packageTemplatePath: this.toAbsolutePath(packageTemplatePath, undefined),
    };
  }

  private toAbsolutePath(
    path: string | undefined,
    fallback: string | undefined,
  ) {
    return path ? resolve(path) : fallback;
  }
}
