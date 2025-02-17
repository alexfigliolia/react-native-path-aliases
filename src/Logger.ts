import chalk from "chalk";

export class Logger {
  private static active = false;
  public static red = chalk.redBright.bold;
  public static blue = chalk.blueBright.bold;

  public static activate() {
    this.active = true;
  }

  public static deactivate() {
    this.active = false;
  }

  public static info = this.activeLog((...msg: any[]) => {
    console.log(this.blue("RN Path Aliases:"), ...msg);
  });

  public static error = this.activeLog((...msg: any[]) => {
    console.log(this.red("RN Path Aliases:"), ...msg);
  });

  public static underline = this.activeLog((str: string) => {
    this.info(chalk.underline(str));
  });

  private static activeLog<F extends (...args: any[]) => void>(func: F) {
    return (...args: Parameters<F>) => {
      if (this.active) {
        func(...args);
      }
    };
  }
}
