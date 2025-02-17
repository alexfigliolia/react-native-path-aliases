export interface CPOptions {
  aliasOnly?: boolean;
  destination?: string;
  tsConfigPath?: string;
  babelConfigPath?: string;
  packageTemplatePath?: string;
}

export interface CPPaths {
  aliasOnly?: boolean;
  destination?: string;
  tsConfigPath: string;
  babelConfigPath: string;
  packageTemplatePath?: string;
}

export interface CLIOptions {
  name?: string | undefined;
  aliasOnly?: boolean | undefined;
  destination?: string | undefined;
  tsConfigPath?: string | undefined;
  babelConfigPath?: string | undefined;
  packageTemplatePath?: string | undefined;
}
