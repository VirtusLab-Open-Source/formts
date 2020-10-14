import { assert, IsExact } from "conditional-type-checks";

import { FormValidator } from "../types/form-validator";

import { createFormSchema } from "./create-form-schema";
import { createFormValidator } from "./create-form-validator";

describe("createFormValidator types", () => {
  const Schema = createFormSchema(
    fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
    }),
    errors => errors<"err1" | "err2">()
  );

  it("resolves ok", () => {
    const formValidator = createFormValidator(Schema, _validate => []);

    type Actual = typeof formValidator;
    type Expected = FormValidator<
      {
        string: string;
        choice: "A" | "B" | "C";
        num: number | "";
        bool: boolean;
      },
      "err1" | "err2"
    >;

    assert<IsExact<Actual, Expected>>(true);
  });
});

describe("createFormValidator", () => {
  const Schema = createFormSchema(
    fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      instance: fields.instanceOf(Date),
      arrayString: fields.array(fields.string()),
      arrayChoice: fields.array(fields.choice("a", "b", "c")),
      arrayArrayString: fields.array(fields.array(fields.string())),
      object: fields.object({ str: fields.string(), num: fields.number() }),
      arrayObjectString: fields.array(fields.object({ str: fields.string() })),
      objectArray: fields.object({
        arrayString: fields.array(fields.string()),
      }),
      objectObjectArrayObjectString: fields.object({
        obj: fields.object({
          array: fields.array(fields.object({ str: fields.string() })),
        }),
      }),
    }),
    error => error<"REQUIRED" | "TOO_SHORT" | "INVALID_VALUE">()
  );

  it("should return ERR for failing single-rule on string field", async () => {
    const stringRequiredValidator = (x: string) => (x ? null : "REQUIRED");
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
      }),
    ]);
    const getValue = () => "" as any;

    const validation = await validate([Schema.string], getValue);

    expect(validation).toEqual([{ field: Schema.string, error: "REQUIRED" }]);
  });

  it("should return null for passing single-rule on string field", async () => {
    const stringRequiredValidator = (x: string) => (x ? null : "REQUIRED");
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
      }),
    ]);
    const getValue = () => "defined string" as any;

    const validation = await validate([Schema.string], getValue);

    expect(validation).toEqual([{ field: Schema.string, error: null }]);
  });

  it("should return ERR for failing all of multiple-rule on string field", async () => {
    const stringRequiredValidator = (x: string) =>
      x !== "" ? null : "REQUIRED";
    const stringLengthValidator = (x: string) =>
      x.length > 3 ? null : "TOO_SHORT";
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator, stringLengthValidator],
      }),
    ]);
    const getValue = () => "" as any;

    const validation = await validate([Schema.string], getValue);

    expect(validation).toEqual([{ field: Schema.string, error: "REQUIRED" }]);
  });

  it("should return ERR for failing last of multiple-rule on string field", async () => {
    const stringRequiredValidator = (x: string) =>
      x !== "" ? null : "REQUIRED";
    const stringLengthValidator = (x: string) =>
      x.length > 3 ? null : "TOO_SHORT";
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator, stringLengthValidator],
      }),
    ]);
    const getValue = () => "ab" as any;

    const validation = await validate([Schema.string], getValue);

    expect(validation).toEqual([{ field: Schema.string, error: "TOO_SHORT" }]);
  });

  it("should return null for passing all of multiple-rule on string field", async () => {
    const stringRequiredValidator = (x: string) =>
      x !== "" ? null : "REQUIRED";
    const stringLengthValidator = (x: string) =>
      x.length > 3 ? null : "TOO_SHORT";
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator, stringLengthValidator],
      }),
    ]);
    const getValue = () => "abcd" as any;

    const validation = await validate([Schema.string], getValue);

    expect(validation).toEqual([{ field: Schema.string, error: null }]);
  });

  it("should return ERR for failing single-rule on choice field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.choice,
        rules: () => [x => (x === "A" ? "INVALID_VALUE" : null)],
      }),
    ]);
    const getValue = () => "A" as any;

    const validation = await validate([Schema.choice], getValue);

    expect(validation).toEqual([
      { field: Schema.choice, error: "INVALID_VALUE" },
    ]);
  });

  it("should return null for passing single-rule on choice field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.choice,
        rules: () => [x => (x === "A" ? "INVALID_CHOICE" : null)],
      }),
    ]);
    const getValue = () => "C" as any;

    const validation = await validate([Schema.choice], getValue);

    expect(validation).toEqual([{ field: Schema.choice, error: null }]);
  });

  it("should return ERR for failing single-rule on instance field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.instance,
        rules: () => [x => (x === null ? "REQUIRED" : null)],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate([Schema.instance], getValue);

    expect(validation).toEqual([{ field: Schema.instance, error: "REQUIRED" }]);
  });

  it("should return ERR for failing multiple-rule on string array field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.arrayString.root,
        rules: () => [
          x => (x.length > 3 ? null : "TOO_SHORT"),
          x => (x.some(y => y === "invalid") ? "INVALID_VALUE" : null),
        ],
      }),
    ]);
    const getValue = () => ["ok", "very-ok", "invalid", "still-ok"] as any;

    const validation = await validate([Schema.arrayString.root], getValue);

    expect(validation).toEqual([
      { field: Schema.arrayString.root, error: "INVALID_VALUE" },
    ]);
  });

  it("should return null for passing single-rule on string array array field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.arrayArrayString.root,
        rules: () => [x => (x.length > 3 ? null : "TOO_SHORT")],
      }),
    ]);
    const getValue = () =>
      [["ok"], ["very-ok"], ["invalid"], ["still-ok"]] as any;

    const validation = await validate([Schema.arrayArrayString.root], getValue);

    expect(validation).toEqual([
      { field: Schema.arrayArrayString.root, error: null },
    ]);
  });

  it("should return ERR for failing async single-rule on object field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.object.root,
        rules: () => [() => wait("INVALID_VALUE", 300)],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate([Schema.object.root], getValue);

    expect(validation).toEqual([
      { field: Schema.object.root, error: "INVALID_VALUE" },
    ]);
  });

  it("should return ERR for failing async multi-rule on object field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.object.root,
        rules: () => [() => wait(null, 300), () => wait("REQUIRED", 300)],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate([Schema.object.root], getValue);

    expect(validation).toEqual([
      { field: Schema.object.root, error: "REQUIRED" },
    ]);
  });

  it("should return null for passing async multi-rule on object field ", async () => {
    const { validate } = createFormValidator(Schema, validate => [
      validate({
        field: Schema.object.root,
        rules: () => [() => wait(null, 300), () => wait(null, 300)],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate([Schema.object.root], getValue);

    expect(validation).toEqual([{ field: Schema.object.root, error: null }]);
  });
});

export const wait = <T extends string | null>(
  value: T,
  ms: number
): Promise<T> => new Promise(resolve => setTimeout(() => resolve(value), ms));
