import type { ObjectExpression } from "jscodeshift";
import codeShift from "jscodeshift";
import type { ASTList, TruthyASTListItem } from "./types";

export class CodeMods {
  public static addAlias(
    resolverConfig: TruthyASTListItem,
    packageName: string,
    destination: string,
  ) {
    codeShift(resolverConfig)
      .find(codeShift.Property)
      .forEach(path => {
        if (
          path.node.type === "Property" &&
          path.node.key.type === "Identifier" &&
          path.node.key.name === "alias" &&
          path.node.value.type === "ObjectExpression"
        ) {
          const { properties } = path.node.value;
          const existingPropertyIndex = properties.findIndex(prop => {
            if (prop.type !== "Property") {
              return false;
            }
            return (
              codeShift.Identifier.check(prop.key) &&
              prop.key.name === packageName
            );
          });
          const update = codeShift.property(
            "init",
            codeShift.identifier(packageName),
            codeShift.stringLiteral(`${destination}/${packageName}`),
          );
          if (existingPropertyIndex !== -1) {
            properties[existingPropertyIndex] = update;
          } else {
            properties.push(update);
          }
        }
      });
  }

  public static addModuleResolverPlugin(babelConfig: string): string {
    try {
      const source = codeShift(babelConfig);
      source
        .find(codeShift.AssignmentExpression, {
          left: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "module" },
            property: { type: "Identifier", name: "exports" },
          },
        })
        .forEach(path => {
          if (path.value.right.type !== "ObjectExpression") {
            return;
          }
          let configPresent = false;
          codeShift(path)
            .find(codeShift.Property)
            .forEach(path => {
              if (
                path.node.type === "Property" &&
                path.node.key.type === "Identifier" &&
                path.node.key.name === "plugins" &&
                path.node.value.type === "ArrayExpression"
              ) {
                configPresent = true;
                this.createModuleResolverPlugin(path.node.value.elements);
              }
            });
          if (!configPresent) {
            this.initializePlugins(path.value.right.properties);
            throw new Error("Adding Plugin Declaration", {
              cause: source.toSource(),
            });
          }
        });
      return source.toSource();
    } catch (error) {
      return this.addModuleResolverPlugin((error as Error).cause as string);
    }
  }

  private static initializePlugins(properties: ObjectExpression["properties"]) {
    properties.push(
      codeShift.property(
        "init",
        codeShift.identifier("plugins"),
        codeShift.arrayExpression([]),
      ),
    );
  }

  private static createModuleResolverPlugin(list: ASTList) {
    list.push(
      codeShift.arrayExpression([
        codeShift.stringLiteral("module-resolver"),
        codeShift.objectExpression([
          codeShift.property(
            "init",
            codeShift.identifier("root"),
            codeShift.arrayExpression([codeShift.stringLiteral(".")]),
          ),
          codeShift.property(
            "init",
            codeShift.identifier("extensions"),
            codeShift.arrayExpression(
              [".js", ".ts", ".tsx", ".jsx", ".json"].map(ext =>
                codeShift.stringLiteral(ext),
              ),
            ),
          ),
          codeShift.property(
            "init",
            codeShift.identifier("alias"),
            codeShift.objectExpression([]),
          ),
        ]),
      ]),
    );
  }
}
