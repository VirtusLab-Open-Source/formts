import { entries } from "../../../utils";
import { TouchedValues } from "../../types/formts-state";

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

const isPlainObject = (it: unknown): it is object =>
  it != null && typeof it === "object" && (it as any).constructor === Object;
