import type {
  ExpressionStatement,
  RestElement,
  SpreadElement,
} from "jscodeshift";

export type ASTList = ASTListItem[];

export type ASTListItem = TruthyASTListItem | null;

export type TruthyASTListItem =
  | RestElement
  | SpreadElement
  | ExpressionStatement["expression"];
