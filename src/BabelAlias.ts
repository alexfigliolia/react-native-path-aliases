import { ChildProcess } from "@figliolia/child-process";
import { Alias } from "./Alias";
import { Logger } from "./Logger";
import type { Options } from "./Options";
import type { BabelConfig } from "./types";
import { writeFileSync } from "fs";

export class BabelAlias extends Alias {
  public baseURL: string;
  private install = false;
  constructor(baseURL: string, options: Options) {
    super(options);
    this.baseURL = baseURL;
  }

  public async run() {
    Logger.info("Creating Babel Config Alias");
    const BabelConfig = await this.importFile();
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
    const alias = this.addKeyAndSort(
      { ...plugin?.alias },
      this.options.packageName,
      `${this.destination}/${this.options.packageName}`,
    );
    copy.plugins[pluginIndex] = ["module-resolver", { ...plugin, alias }];
    await this.writeFile(copy);
    return this.install;
  }

  protected async writeFile(config: BabelConfig) {
    writeFileSync(
      this.options.get("babelConfigPath"),
      this.toBabelConfig(config),
    );
    await new ChildProcess(
      `yarn prettier --write ${this.options.get("babelConfigPath")}`,
    ).handler;
  }

  protected get destination() {
    const target = this.options.get("destination");
    return target ? `./${target.replace(this.CWD, "")}` : this.baseURL;
  }

  protected async importFile() {
    this.readFile(this.options.get("babelConfigPath"), "Babel Config");
    return (await import(this.options.get("babelConfigPath")))
      .default as BabelConfig;
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
    if (this.options.get("babelConfigPath").endsWith(".json")) {
      return json;
    }
    return `module.exports = ${json}`;
  }
}
