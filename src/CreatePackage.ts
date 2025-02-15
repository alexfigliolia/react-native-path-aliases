import { parseArgs } from "node:util";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { TSConfigJSON } from "types-tsconfig";
import { ChildProcess } from "@figliolia/child-process";
import { Logger } from "./Logger";
import type { BabelConfig, CPPaths } from "./types";

export class CreatePackage {
  private install = false;
  private options!: CPPaths;
  private readonly CWD = process.cwd();

  public execute() {
    const {
      values: {
        name,
        aliasOnly,
        destination,
        tsConfigPath,
        babelConfigPath,
        packageTemplatePath,
      },
    } = parseArgs({
      options: {
        name: { type: "string", short: "n", multiple: false },
        aliasOnly: { type: "boolean", short: "a", multiple: false },
        destination: { type: "string", short: "d", multiple: false },
        tsConfigPath: { type: "string", short: "t", multiple: false },
        babelConfigPath: { type: "string", short: "b", multiple: false },
        packageTemplatePath: { type: "string", short: "p", multiple: false },
      },
    });
    this.options = {
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
    if (!name || name.trim().length < 3) {
      Logger.info("The --name flag is required");
      process.exit(0);
    }
    return this.aliasPaths(name.trim());
  }

  private async aliasPaths(pkgName: string) {
    const baseURL = (await this.toTSAlias(pkgName)) ?? "./";
    if (!this.options.aliasOnly) {
      this.createPackageFolder(pkgName, baseURL);
    }
    await this.toBabelAlias(pkgName, baseURL);
    if (this.install) {
      Logger.info(
        "Please add the following package to your project's devDependencies",
      );
      Logger.underline("babel-plugin-module-resolver");
    }
  }

  private createPackageFolder(pkgName: string, baseURL: string) {
    Logger.info("Creating package directory");
    const pkgFolder = resolve(this.CWD, baseURL, pkgName);
    if (existsSync(pkgFolder)) {
      Logger.info(
        `A package directory with the name "${pkgName}" already exists. Skipping task`,
      );
    }
    mkdirSync(pkgFolder, { recursive: true });
    if (this.options.packageTemplatePath) {
      cpSync(this.options.packageTemplatePath, pkgFolder, { recursive: true });
    }
  }

  private async toTSAlias(pkgName: string) {
    Logger.info("Creating TS Config Alias");
    this.readFile(this.options.tsConfigPath, "TS Config");
    const TSConfig: TSConfigJSON = (await import(this.options.tsConfigPath))
      .default;
    const copy = { ...TSConfig };
    const destination = this.options.destination
      ? `./${this.options.destination.replace(this.CWD, "")}`
      : "./";
    const paths = this.addKeyAndSort(
      { ...TSConfig?.compilerOptions?.paths },
      pkgName,
      [`${destination}${pkgName}/index.ts`],
    );
    if (!copy.compilerOptions) {
      copy.compilerOptions = {};
    }
    copy.compilerOptions.paths = paths;
    writeFileSync(this.options.tsConfigPath, JSON.stringify(copy, null, 2));
    return copy.compilerOptions?.baseUrl;
  }

  private async toBabelAlias(pkgName: string, baseURL: string) {
    Logger.info("Creating Babel Config Alias");
    this.readFile(this.options.babelConfigPath, "Babel Config");
    const BabelConfig: BabelConfig = (
      await import(this.options.babelConfigPath)
    ).default;
    const copy = { ...BabelConfig };
    let pluginIndex = -1;
    if (!copy.plugins) {
      copy.plugins = [];
    }
    for (const plugin of copy.plugins) {
      pluginIndex++;
      if (plugin[0] === "module-resolver") {
        break;
      }
    }
    let plugin = copy?.plugins?.[pluginIndex]?.[1];
    if (
      pluginIndex === -1 ||
      typeof plugin === "string" ||
      typeof plugin === "undefined"
    ) {
      this.addModuleResolverPlugin(copy);
      pluginIndex = copy.plugins.length - 1;
      plugin = copy.plugins[pluginIndex][1] as Record<string, any>;
    }
    const destination = this.options.destination
      ? `./${this.options.destination.replace(this.CWD, "")}`
      : baseURL;
    const alias = this.addKeyAndSort(
      { ...plugin?.alias },
      pkgName,
      `${destination}/${pkgName}`,
    );
    copy.plugins[pluginIndex] = ["module-resolver", { ...plugin, alias }];
    writeFileSync(this.options.babelConfigPath, this.toBabelConfig(copy));
    await new ChildProcess(`yarn prettier --write ./babel.config.js`).handler;
  }

  private addModuleResolverPlugin(BabelConfig: BabelConfig) {
    Logger.info("Adding module resolver plugin to your babel config");
    if (!BabelConfig.plugins) {
      BabelConfig.plugins = [];
    }
    BabelConfig.plugins.push([
      "module-resolver",
      {
        root: ["."],
        extensions: [".js", ".ts", ".tsx", ".jsx", ".json"],
        alias: {},
      },
    ]);
    this.install = true;
  }

  private toBabelConfig(config: BabelConfig) {
    const json = JSON.stringify(config, null, 2);
    if (this.options.babelConfigPath.endsWith(".json")) {
      return json;
    }
    return `module.exports = ${json}`;
  }

  private addKeyAndSort<V>(aliases: Record<string, V>, key: string, value: V) {
    aliases[key] = value;
    const keys = Object.keys(aliases);
    keys.sort();
    return keys.reduce<Record<string, V>>((acc, next) => {
      acc[next] = aliases[next];
      return acc;
    }, {});
  }

  private readFile(path: string, name: string) {
    if (!existsSync(path)) {
      Logger.error(`Your ${name} was not found. Here's where I checked:`);
      Logger.underline(path);
      process.exit(0);
    }
  }

  private toAbsolutePath(
    path: string | undefined,
    fallback: string | undefined,
  ) {
    return path ? resolve(path) : fallback;
  }
}
