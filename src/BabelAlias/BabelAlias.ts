import { ChildProcess } from "@figliolia/child-process";
import { readFileSync, writeFileSync } from "fs";
import codeShift from "jscodeshift";
import { CodeMods } from "./CodeMods";
import { Alias } from "../Alias";
import type { Options } from "../Options";
import { Logger } from "../Logger";
import { ModuleResolverMatch } from "./ModuleResolverMatch";
import type { TruthyASTListItem } from "./types";

export class BabelAlias extends Alias {
  public baseURL: string;
  constructor(baseURL: string, options: Options) {
    super(options);
    this.baseURL = baseURL;
  }

  public run() {
    Logger.info("Creating Babel Config Alias");
    const babelConfig = this.importFile();
    return this.transform(babelConfig);
  }

  private async transform(
    babelConfig: string,
    install = false,
  ): Promise<boolean> {
    let transformed = false;
    const resolverConfig = this.matchModuleResolver(babelConfig, config => {
      CodeMods.addAlias(config, this.options.packageName, this.destination);
      transformed = true;
    });
    if (!transformed) {
      Logger.info("Adding module resolver plugin to your babel config");
      return this.transform(
        CodeMods.addModuleResolverPlugin(babelConfig),
        true,
      );
    }
    await this.writeFile(resolverConfig.toSource());
    return install;
  }

  protected async writeFile(config: string) {
    writeFileSync(this.options.get("babelConfigPath"), config);
    await ChildProcess.execute(
      `yarn prettier --write ${this.options.get("babelConfigPath")}`,
    );
  }

  protected get destination() {
    const target = this.options.get("destination");
    if (target) {
      return `./${target.replace(this.CWD, "")}`;
    }
    if (this.baseURL.startsWith("./")) {
      return this.baseURL;
    }
    return `./${this.baseURL}`;
  }

  protected importFile() {
    this.validatePath(this.options.get("babelConfigPath"), "Babel Config");
    return readFileSync(this.options.get("babelConfigPath")).toString();
  }

  private matchModuleResolver<V>(
    babelConfig: string,
    onMatch: (result: TruthyASTListItem) => V,
  ) {
    return codeShift(babelConfig)
      .find(codeShift.ArrayExpression)
      .forEach(path => {
        const filter = new ModuleResolverMatch(path.node.elements);
        const AST = filter.search();
        if (AST) {
          onMatch(AST);
        }
      });
  }
}
