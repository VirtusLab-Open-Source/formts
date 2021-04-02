import { Nominal, range } from "../../utils";

import { _FieldDecoderImpl } from "./field-decoder";

//@ts-ignore
export type _FieldTemplateImpl<T> = {
  __path: string;
};

/**
 * Pointer to a form field template.
 * Used to interact with Formts validation API via <arrayField>.every() method.
 */
// @ts-ignore
export interface FieldTemplate<T, Err = unknown>
  extends Nominal<"FieldTemplate", Err> {}

// prettier-ignore
export type GenericFieldTemplate<T, Err = unknown> =
  [T] extends [Array<unknown>]
  ? ArrayFieldTemplate<T, Err>
  : [T] extends [object]
  ? ObjectFieldTemplate<T, Err>
  : FieldTemplate<T, Err>;

// prettier-ignore
export type ArrayFieldTemplate<T extends Array<unknown>, Err> =
  & FieldTemplate<T, Err>
  & {
    readonly nth: (index: number) => GenericFieldTemplate<T[number], Err>;
    readonly every: () => GenericFieldTemplate<T[number], Err>;
  };

// prettier-ignore
export type ObjectFieldTemplate<T extends object, Err> =
  & FieldTemplate<T, Err>
  & { readonly [K in keyof T]: GenericFieldTemplate<T[K], Err> };

export const pathIsTemplate = (x: string): boolean => x.includes("[*]");

export const generateFieldPathsFromTemplate = (
  template: string,
  getValue: (path: string) => unknown
): string[] => {
  const templateIndex = template.indexOf("[*]");
  if (templateIndex === -1) {
    return [template];
  } else {
    const root = template.slice(0, templateIndex);
    const childPath = template.slice(templateIndex + 3);
    const value = getValue(root);

    if (!Array.isArray(value) || value.length <= 0) {
      return [];
    } else {
      return range(0, value.length - 1).flatMap(index => {
        const indexedTemplate = `${root}[${index}]${childPath}`;
        return generateFieldPathsFromTemplate(indexedTemplate, getValue);
      });
    }
  }
};

export const pathMatchesTemplatePath = (path: string, template: string) => {
  if (!template.includes("[*]")) {
    return false;
  } else {
    const templateRegex = template
      .replace(new RegExp("\\.", "g"), "\\.")
      .replace(new RegExp("\\[", "g"), "\\[")
      .replace(new RegExp("\\]", "g"), "\\]")
      .replace(new RegExp("\\*", "g"), "(\\d+)");

    return !!path.match(new RegExp(`\^${templateRegex}\$`));
  }
};
