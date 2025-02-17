import codeShift from "jscodeshift";
import type { ASTList, ASTListItem, TruthyASTListItem } from "./types";

export class ModuleResolverMatch {
  list: ASTList;
  foundResolverPlugin = false;
  constructor(list: ASTList) {
    this.list = list;
  }

  public search() {
    let left = 0;
    const { length } = this.list;
    while (left < length - 1) {
      const item = this.list[left];
      if (!item) {
        left++;
        continue;
      }
      if (this.matchModuleResolver(item)) {
        const config = this.list[left + 1];
        return this.matchResolverConfiguration(config);
      }
      left++;
    }
    return false;
  }

  private matchModuleResolver(item: TruthyASTListItem) {
    return codeShift.match(item, {
      type: "Literal",
      value: "module-resolver",
    });
  }

  private matchResolverConfiguration(item: ASTListItem) {
    if (!item) {
      return false;
    }
    const keysToFind = new Set(["root", "extensions", "alias"]);
    return codeShift(item)
      .find(codeShift.Identifier)
      .filter(property => {
        if (
          property.node.type === "Identifier" &&
          keysToFind.has(property.value.name)
        ) {
          keysToFind.delete(property.value.name);
          if (keysToFind.size === 0) {
            return true;
          }
        }
        return false;
      }).length > 0
      ? item
      : false;
  }
}
