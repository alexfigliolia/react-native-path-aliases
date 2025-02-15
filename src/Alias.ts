import { existsSync } from "fs";
import { Logger } from "./Logger";
import type { Options } from "./Options";

export abstract class Alias {
  public options: Options;
  public CWD = process.cwd();
  constructor(options: Options) {
    this.options = options;
  }

  public abstract run(): Promise<any>;

  protected abstract importFile(): Promise<any>;

  protected abstract get destination(): string;

  protected abstract writeFile(...args: any[]): any;

  protected addKeyAndSort<V>(
    aliases: Record<string, V>,
    key: string,
    value: V,
  ) {
    aliases[key] = value;
    const keys = Object.keys(aliases);
    keys.sort();
    return keys.reduce<Record<string, V>>((acc, next) => {
      acc[next] = aliases[next];
      return acc;
    }, {});
  }

  protected readFile(path: string, name: string) {
    if (!existsSync(path)) {
      Logger.error(`Your ${name} was not found. Here's where I checked:`);
      Logger.underline(path);
      process.exit(0);
    }
  }
}
