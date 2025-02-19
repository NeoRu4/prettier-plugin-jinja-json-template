import type { Parser } from "prettier";
import type { Block, Expression, Node, Statement } from "./types";
import { placeholderGenerator, replaceAt } from "./utils/placeholder-generator";
import { NOT_FOUND } from "./constants";

const STYLE = "jinja" as const;

const regex =
  /(?<node>{{(?<startDelimiterEx>[-+]?)\s*(?<expression>'([^']|\\')*'|"([^"]|\\")*"|[\S\s]*?)\s*(?<endDelimiterEx>[-+]?)}}|{%(?<startDelimiter>[-+]?)\s*(?<statement>(?<keyword>\w+)('([^']|\\')*'|"([^"]|\\")*"|[\S\s])*?)\s*(?<endDelimiter>[-+]?)%}|(?<comment>{#[\S\s]*?#}))/;

export const parse: Parser<Node>["parse"] = (text) => {
  const statementStack: Statement[] = [];

  const root: Node = {
    id: "0",
    type: "root" as const,
    content: text,
    preNewLines: 0,
    originalText: text,
    index: 0,
    length: 0,
    nodes: {},
  };

  const generatePlaceholder = placeholderGenerator(text, STYLE);

  let match;
  let i = 0;
  while ((match = root.content.slice(i).match(regex)) !== null) {
    if (!match.groups || match.index === undefined) {
      continue;
    }
    const matchLength = match[0].length;

    const matchText = match.groups.node;
    const expression = match.groups.expression;
    const statement = match.groups.statement;
    const ignoreBlock = match.groups.ignoreBlock;
    const comment = match.groups.comment;

    if (!matchText && !expression && !statement && !ignoreBlock && !comment) {
      continue;
    }

    const placeholder = generatePlaceholder();

    const emptyLinesBetween = root.content
      .slice(i, i + match.index)
      .match(/^\s+$/) || [""];

    const preNewLines = emptyLinesBetween.length
      ? emptyLinesBetween[0].split("\n").length - 1
      : 0;

    const node = {
      id: placeholder,
      preNewLines,
      originalText: matchText,
      index: match.index + i,
      length: matchText.length,
      nodes: root.nodes,
    };

    if (comment != undefined || ignoreBlock != undefined) {
      root.content = replaceAt(
        root.content,
        placeholder,
        match.index + i,
        matchLength,
      );
      root.nodes[node.id] = {
        ...node,
        type: comment ? "comment" : "ignore",
        content: comment || ignoreBlock,
      };

      i += match.index + placeholder.length;
    }

    if (expression != undefined) {
      const delimiter = {
        start: match.groups.startDelimiterEx,
        end: match.groups.endDelimiterEx,
      };

      root.content = replaceAt(
        root.content,
        placeholder,
        match.index + i,
        matchLength,
      );
      root.nodes[node.id] = {
        ...node,
        type: "expression",
        content: expression,
        delimiter,
      } as Expression;

      i += match.index + placeholder.length;
    }

    if (statement != undefined) {
      const keyword = match.groups.keyword;
      const delimiter = {
        start: match.groups.startDelimiter,
        end: match.groups.endDelimiter,
      };

      if (keyword.startsWith("end")) {
        let start: Statement | undefined;
        while (!start) {
          start = statementStack.pop();

          if (!start) {
            throw new Error(
              `No opening statement found for closing statement "{% ${statement} %}".`,
            );
          }

          if (keyword.replace("end", "") !== start.keyword) {
            root.content = replaceAt(
              root.content,
              start.id,
              start.index,
              start.length,
            );
            i += start.id.length - start.length;

            start = undefined;
          }
        }

        const end = {
          ...node,
          index: match.index + i,
          type: "statement",
          content: statement,
          keyword,
          delimiter,
        } as Statement;

        root.nodes[end.id] = end;

        const originalText = root.content.slice(
          start.index,
          end.index + end.length,
        );

        const block = {
          id: generatePlaceholder(),
          type: "block",
          start: start,
          end: end,
          content: originalText.slice(
            start.length,
            originalText.length - end.length,
          ),
          preNewLines: start.preNewLines,
          containsNewLines: originalText.search("\n") !== NOT_FOUND,
          originalText,
          index: start.index,
          length: end.index + end.length - start.index,
          nodes: root.nodes,
        } as Block;

        root.nodes[block.id] = block;

        root.content = replaceAt(
          root.content,
          block.id,
          start.index,
          originalText.length,
        );

        i += match.index + block.id.length + end.length - originalText.length;
      } else {
        root.nodes[node.id] = {
          ...node,
          type: "statement",
          content: statement,
          keyword,
          delimiter,
        } as Statement;

        statementStack.push(root.nodes[placeholder] as Statement);

        i += match.index + matchLength;
      }
    }
  }

  for (const stmt of statementStack) {
    root.content = root.content.replace(stmt.originalText, stmt.id);
  }

  return root;
};
