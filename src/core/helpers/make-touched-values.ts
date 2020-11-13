import { entries, isPlainObject } from "../../utils";
import { TouchedValues } from "../types/formts-state";

export const makeUntouchedValues = <T>(value: T): TouchedValues<T> =>
  transformToBoolObject(value, false);

export const makeTouchedValues = <T>(value: T): TouchedValues<T> =>
  transformToBoolObject(value, true);

const transformToBoolObject = <T>(
  value: T,
  bool: boolean
): TouchedValues<T> => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    // a bit of premature optimization
    return bool as TouchedValues<T>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0 && bool === true) {
      // special case to mark empty array as touched
      return bool as TouchedValues<T>;
    }

    return (value.map(v =>
      transformToBoolObject(v, bool)
    ) as unknown) as TouchedValues<T>;
  }

  if (isPlainObject(value)) {
    return entries(value).reduce((obj, [key, value]) => {
      (obj as any)[key] = transformToBoolObject(value, bool);
      return obj;
    }, {} as TouchedValues<T>);
  }

  return bool as TouchedValues<T>;
};
