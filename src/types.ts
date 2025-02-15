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
  tsConfigPath?: string;
  babelConfigPath?: string;
  packageTemplatePath?: string;
}

export interface CPPaths {
  tsConfigPath: string;
  babelConfigPath: string;
  packageTemplatePath?: string;
}
