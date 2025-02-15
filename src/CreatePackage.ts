import { parseArgs } from "node:util";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { ChildProcess } from "@figliolia/child-process";
import type { TSConfigJSON } from "types-tsconfig";
import { Logger } from "./Logger";
import type { BabelConfig, CPPaths } from "./types";

export class CreatePackage {
  private install = false;
  private options!: CPPaths;
  private readonly CWD = process.cwd();

  public execute() {
    const {
      values: { name, tsConfigPath, babelConfigPath, packageTemplatePath },
    } = parseArgs({
      options: {
        name: { type: "string", short: "n", multiple: false },
        tsConfigPath: { type: "string", short: "t", multiple: false },
        babelConfigPath: { type: "string", short: "b", multiple: false },
        packageTemplatePath: { type: "string", short: "p", multiple: false },
      },
    });
    this.options = {
      tsConfigPath: this.toAbsolutePath(tsConfigPath, this.CWD)!,
      babelConfigPath: this.toAbsolutePath(babelConfigPath, this.CWD)!,
      packageTemplatePath: this.toAbsolutePath(packageTemplatePath, undefined),
    };
    if (!name || name.trim().length < 3) {
      Logger.info("The --name flag is required");
      process.exit(0);
    }
    return this.aliasPaths(name.trim());
  }

  private async aliasPaths(pkgName: string) {
    const baseURL = this.toTSAlias(pkgName) ?? "./";
    this.createPackageFolder(pkgName, baseURL);
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

  private toTSAlias(pkgName: string) {
    Logger.info("Creating TS Config Alias");
    const file = this.readFile(this.options.tsConfigPath, "TS Config");
    const TSConfig = JSON.parse(file) as TSConfigJSON;
    const copy = { ...TSConfig };
    const paths = this.addKeyAndSort(
      { ...TSConfig?.compilerOptions?.paths },
      pkgName,
      [`${pkgName}/index.ts`],
    );
    paths[pkgName] = [`${pkgName}/index.ts`];
    const keys = Object.keys(paths);
    keys.sort();
    if (!copy.compilerOptions) {
      copy.compilerOptions = {};
    }
    copy.compilerOptions.paths = paths;
    writeFileSync(
      resolve(__dirname, "../tsconfig.json"),
      JSON.stringify(copy, null, 2),
    );
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
    let plugin = copy.plugins[pluginIndex][1];
    if (
      pluginIndex === -1 ||
      typeof plugin === "string" ||
      typeof plugin === "undefined"
    ) {
      this.addModuleResolverPlugin(copy, baseURL);
      plugin = copy.plugins[pluginIndex][1] as Record<string, any>;
    }
    const alias = this.addKeyAndSort(
      { ...plugin?.alias },
      pkgName,
      `./src/${pkgName}`,
    );
    copy.plugins[pluginIndex] = ["module-resolver", { ...plugin, alias }];
    writeFileSync(
      this.options.babelConfigPath,
      `module.exports = ${JSON.stringify(copy, null, 2)}`,
    );
    await new ChildProcess(`yarn prettier --write ./babel.config.js`).handler;
  }

  private addModuleResolverPlugin(BabelConfig: BabelConfig, baseURL: string) {
    Logger.info("Adding module resolver plugin to your babel config");
    BabelConfig.plugins?.push([
      "module-resolver",
      {
        root: [baseURL],
        extensions: [".js", ".ts", ".tsx", ".jsx", ".json"],
        alias: {},
      },
    ]);
    this.install = true;
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
    return readFileSync(path).toString();
  }

  private toAbsolutePath(
    path: string | undefined,
    fallback: string | undefined,
  ) {
    return path ? resolve(path) : fallback;
  }
}
