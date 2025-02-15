export interface BabelConfig {
  presets?: (string | [string, Record<string, any>?])[];
  plugins?: (string | [string, Record<string, any>?])[];
  ignore?: string[];
  only?: string[];
  sourceMaps?: boolean | "inline" | "both";
  inputSourceMap?: boolean | Record<string, any>;
  babelrc?: boolean;
  configFile?: boolean | string;
  env?: {
    [key: string]: BabelConfig;
  };
  overrides?: {
    test?: string | string[];
    include?: string | string[];
    exclude?: string | string[];
    presets?: (string | [string, Record<string, any>?])[];
    plugins?: (string | [string, Record<string, any>?])[];
  }[];
  passPerPreset?: boolean;
}

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
