import type { TSConfigJSON } from "types-tsconfig";
import { Alias } from "./Alias";
import { Logger } from "./Logger";
import { writeFileSync } from "fs";

export class TSAlias extends Alias {
  public async run() {
    Logger.info("Creating TS Config Alias");
    const TSConfig = await this.importFile();
    const copy = { ...TSConfig };
    const paths = this.addKeyAndSort(
      { ...TSConfig?.compilerOptions?.paths },
      this.options.packageName,
      [`${this.destination}${this.options.packageName}/index.ts`],
    );
    if (!copy.compilerOptions) {
      copy.compilerOptions = {};
    }
    copy.compilerOptions.paths = paths;
    this.writeFile(copy);
    return copy.compilerOptions?.baseUrl ?? "./";
  }

  protected writeFile(TSConfig: TSConfigJSON) {
    writeFileSync(
      this.options.get("tsConfigPath"),
      JSON.stringify(TSConfig, null, 2),
    );
  }

  protected get destination() {
    const target = this.options.get("destination");
    return target ? `./${target.replace(this.CWD, "")}` : "./";
  }

  protected async importFile() {
    this.validatePath(this.options.get("tsConfigPath"), "TS Config");
    return (await import(this.options.get("tsConfigPath")))
      .default as TSConfigJSON;
  }
}
