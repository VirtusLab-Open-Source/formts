import { values } from "../../utils";
import { TouchedValues } from "../types/formts-state";

export const resolveTouched = (it: unknown): boolean => {
  if (isBool(it)) {
    return it === true;
  }
  if (isArray(it)) {
    return it.some(resolveTouched);
  }
  if (isRecord(it)) {
    return values(it).some(resolveTouched);
  }
  return false;
};

const isBool = (it: unknown): it is boolean => typeof it === "boolean";

const isArray = Array.isArray;

const isRecord = (it: unknown): it is Record<string, TouchedValues<any>> =>
  it && typeof it === "object" && !Array.isArray(it);
