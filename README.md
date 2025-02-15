# React Native Path Aliases
A CLI to manage your package/path aliases in react native apps (or any app using babel and typescript). When adding new packages or aliases to your app, you can synchronize babel's and typescript's path definition by running `react-native-path-aliases --name <my-package-name>`.

### Installation

```bash
yarn add -D react-native-path-aliases
# or
npm i -D react-native-path-aliases
```

### Basic Usage
If both your `tsconfig.json` file and and `babel.config.js` file are at the root of your project, you can run:
```bash
react-native-path-aliases --name <my-package-name>
# or
react-native-path-aliases -n <my-package-name> 
```
to generate new packages/aliases at any time

If your `tsconfig.json` or `babel.config.js` files live under a different path or use different file names, you can run:
```bash
react-native-path-aliases --name <my-package-name> --tsConfigPath path/to/tsconfig --babelConfigPath path/to/babelConfig
# or
react-native-path-aliases -n <my-package-name> -t path/to/tsconfig -b path/to/babelConfig
```

### Creating Aliases without Generating a Package Directory
There may be times where you're integrating path aliases into already existent directories. To generate aliases without generating directories, you can use the `--aliasOnly` or `-a` flag
```bash
react-native-path-aliases --aliasOnly --name <my-package-name>
# or
react-native-path-aliases -a -n <my-package-name> 
```

### Overriding Base URL's
In certain instances you may want to create a package/alias at a different path than your TS Config's baseURL (or "./"). To do so you can run:
```bash
react-native-path-aliases --name <my-package-name> --destination ./path/to/package/destination
# or
react-native-path-aliases -n <my-package-name> -d ./path/to/package/destination
```

### Package Templates
In many projects creating new packages often comes with a default template for the directory being created. This template may include files such as a `package.json`, a `gitignore`, an editor configuration, and more. To configure the CLI to build your custom package template along with your path aliases you can:

1. Create your template directory somewhere inside your app
2. Execute the CLI using the `--packageTemplatePath` (`-p`) flag

```bash
react-native-path-aliases --n <my-package-name> -p path/to/package/tempate
```

The CLI will clone the template directory and copy it over to the location of your new package. By default, packages will be created as an empty directory with the default location `${TSConfig.compilerOptions.baseURL}/${specified-package-name}`.
