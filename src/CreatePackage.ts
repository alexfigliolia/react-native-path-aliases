import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Logger } from "./Logger";
import { Options } from "./Options";
import { TSAlias } from "./TSAlias";
import { BabelAlias } from "./BabelAlias";

export class CreatePackage {
  private options = new Options();
  private readonly CWD = process.cwd();

  public async execute() {
    const typescriptInterface = new TSAlias(this.options);
    const baseURL = (await typescriptInterface.run()) ?? "./";
    if (!this.options.get("aliasOnly")) {
      this.createPackageFolder(this.options.packageName, baseURL);
    }
    const babelInterface = new BabelAlias(baseURL, this.options);
    if (await babelInterface.run()) {
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
    const templatePath = this.options.get("packageTemplatePath");
    if (templatePath) {
      cpSync(templatePath, pkgFolder, {
        recursive: true,
      });
    }
  }
}
