import { entries } from "../../../utils";
import { TouchedValues } from "../../types/formts-state";

export const createInitialTouched = <T>(value: T): TouchedValues<T> => {
  if (Array.isArray(value)) {
    return (value.map(createInitialTouched) as unknown) as TouchedValues<T>;
  }

  if (isPlainObject(value)) {
    return entries(value).reduce((obj, [key, value]) => {
      (obj as any)[key] = createInitialTouched(value);
      return obj;
    }, {} as TouchedValues<T>);
  }

  return false as TouchedValues<T>;
};

const isPlainObject = (it: unknown): it is object =>
  it != null && typeof it === "object" && (it as any).constructor === Object;
