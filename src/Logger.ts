import chalk from "chalk";

export class Logger {
  public static red = chalk.redBright.bold;
  public static blue = chalk.blueBright.bold;

  public static info(...msg: any[]) {
    console.log(this.blue("RN Path Aliases:"), ...msg);
  }

  public static error(...msg: any[]) {
    console.log(this.red("RN Path Aliases:"), ...msg);
  }

  public static underline(str: string) {
    return this.info(chalk.underline(str));
  }
}
