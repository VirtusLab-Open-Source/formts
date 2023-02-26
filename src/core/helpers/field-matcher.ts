import { FieldDescriptor } from "../types/field-descriptor";
import {
  createRegexForTemplate,
  FieldTemplate,
  pathIsTemplate,
} from "../types/field-template";
import { impl } from "../types/type-mapper-util";

type FieldPath = string;
type FieldId = string;

type FieldLike = FieldDescriptor<unknown, unknown> | FieldPath | FieldId;

type AbstractFieldLike = FieldLike | FieldTemplate<unknown>;

/**
 * Utility class for comparing field IDs against other field Ids or FieldDescriptor objects
 */
export class FieldMatcher {
  private readonly fieldPath: string;

  /**
   * @param field field ID or FieldDescriptor
   */
  constructor(field: FieldLike) {
    this.fieldPath = getPath(field);
  }

  /**
   * returns true when `otherField` points to this FieldDescriptor
   *
   * @param otherField field ID or `FieldDescriptor` or `FieldTemplate` (like FieldDescriptor.every())
   */
  matches(otherField: AbstractFieldLike): boolean {
    const otherPath = getPath(otherField);
    if (pathIsTemplate(otherPath)) {
      const otherPathRegex = createRegexForTemplate(otherPath);
      return this.fieldPath.match(otherPathRegex) != null;
    } else {
      return this.fieldPath === otherPath;
    }
  }

  /**
   * returns true when `otherField` points to parent FieldDescriptor
   *
   * @param otherField field ID or `FieldDescriptor` or `FieldTemplate` (like FieldDescriptor.every())
   */
  isChildOf(otherField: AbstractFieldLike): boolean {
    const otherPath = getPath(otherField);

    const commonPath = this.fieldPath.substring(0, otherPath.length);
    if (!new FieldMatcher(commonPath).matches(otherPath)) {
      return false;
    }

    switch (this.fieldPath.charAt(otherPath.length)) {
      case ".": // object child
      case "[": // array element child
        return true;

      default:
        return false;
    }
  }

  /**
   * returns true when `otherField` points to child FieldDescriptor
   *
   * @param otherField field ID or `FieldDescriptor` or `FieldTemplate` (like FieldDescriptor.every())
   */
  isParentOf(otherField: AbstractFieldLike): boolean {
    const otherPath = getPath(otherField);

    const commonPath = otherPath.substring(0, this.fieldPath.length);
    if (!this.matches(commonPath)) {
      return false;
    }

    switch (otherPath.charAt(this.fieldPath.length)) {
      case ".": // object parent
      case "[": // array parent
        return true;

      default:
        return false;
    }
  }
}

const getPath = (field: AbstractFieldLike) =>
  typeof field === "string" ? field : impl(field).__path;
