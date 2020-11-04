import { Primitive } from "../utils/utility-types";

export type Required = { code: "required" };
export type OneOf = { code: "oneOf"; allowedValues: Primitive[] };

export type Integer = { code: "integer" };
export type MinValue = { code: "minValue"; min: number };
export type MaxValue = { code: "maxValue"; max: number };
export type GreaterThan = { code: "greaterThan"; threshold: number };
export type LesserThan = { code: "lesserThan"; threshold: number };

export type Pattern = { code: "pattern"; regex: RegExp };
export type HasSpecialChar = { code: "hasSpecialChar" };
export type HasUpperCaseChar = { code: "hasUpperCaseChar" };
export type HasLowerCaseChar = { code: "hasLowerCaseChar" };

export type MinLength = { code: "minLength"; min: number };
export type MaxLength = { code: "maxLength"; max: number };
export type ExactLength = { code: "exactLength"; expected: number };

export type ValidDate = { code: "validDate" };
export type MinDate = { code: "minDate"; min: Date };
export type MaxDate = { code: "maxDate"; max: Date };
