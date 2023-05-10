import { Expression, SequenceExpression } from 'estree';

/** Parse a JavaScript *expression* string and return the resulting abstract syntax tree in the ESTree format */
export function parseExpression(expression: string): Expression | SequenceExpression;

export interface CodegenOptions {
  /** A hash of allowed top-level constant values */
  constants?: { [cn: string]: string };

  /** A function that is given an AST visitor instance as input and returns an object of allowed functions */
  functions?: (
    astVisitor: any
  ) => { [fn: string]: string | ((args: any) => string) };

  /** An array of variable names that may not be referenced within the expression scope */
  forbidden?: string[];

  /** An array of variable names that may be referenced within the expression scope */
  allowed?: string[];

  /** The name of the primary data input argument within the generated expression function */
  fieldvar?: string;

  /** The name of the variable upon which to lookup global variables */
  globalvar: string | ((id: string) => string);
}

/** Create a new output code generator configured according to the provided options */
export function codegenExpression(
  options: CodegenOptions
): (
  ast: any
) => {
  /** The generated code as a string */
  code: string;

  /** A hash of all properties referenced within the _fieldvar_ scope */
  fields: string[];

  /** A hash of all properties referenced outside a provided allowed list */
  globals: string[];
};

/** An object defining default constant values for the Vega expression language */
export const constants: { [cn: string]: string };

/** Given a *codegen* instance as input, returns an object defining all valid function names for use within an expression */
export function functions(
  codegen: any
): {
  [fn: string]: string | (() => string);
};

/** Constructor for a node in an expression abstract syntax tree (AST) */
export function ASTNode(type: string): void;
