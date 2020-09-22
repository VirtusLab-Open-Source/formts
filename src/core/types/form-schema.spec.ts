import { IsExact, assert, IsNever } from "conditional-type-checks";

import { FieldDescriptor } from "./field-descriptor";
import { FormSchema } from "./form-schema";

type SomeValues = {
  string: string;
  choice: "A" | "B" | "C";
  num: number | "";
  bool: boolean;
  arrayString: string[];
  arrayChoice: Array<"A" | "B" | "C">;
  arrayArrayString: string[][];
  obj: { string: string };
  arrayObj: Array<{ string: string }>;
  instance: Date | null;
};

type SomeErr = "err1" | "err2";

describe("FormSchema type", () => {
  type Schema = FormSchema<SomeValues, SomeErr>;

  it("is an object with a key for every input object key", () => {
    type Actual = keyof Schema;
    type Expected =
      | "string"
      | "choice"
      | "num"
      | "bool"
      | "arrayString"
      | "arrayChoice"
      | "arrayArrayString"
      | "obj"
      | "arrayObj"
      | "instance";

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles string fields", () => {
    type Actual = Schema["string"];
    type Expected = FieldDescriptor<string, SomeErr>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles choice fields", () => {
    type Actual = Schema["choice"];
    type Expected = FieldDescriptor<"A" | "B" | "C", SomeErr>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles number fields", () => {
    type Actual = Schema["num"];
    type Expected = FieldDescriptor<number | "", SomeErr>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles boolean fields", () => {
    type Actual = Schema["bool"];
    type Expected = FieldDescriptor<boolean, SomeErr>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles array fields", () => {
    type Actual = Schema["arrayString"];

    type Expected = {
      root: FieldDescriptor<string[], SomeErr>;
      nth: (index: number) => FieldDescriptor<string, SomeErr>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles nested array fields", () => {
    type Actual = Schema["arrayArrayString"];

    type Expected = {
      root: FieldDescriptor<string[][], SomeErr>;
      nth: (
        index: number
      ) => {
        root: FieldDescriptor<string[], SomeErr>;
        nth: (index: number) => FieldDescriptor<string, SomeErr>;
      };
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("does not handle object fields for now", () => {
    assert<IsNever<Schema["obj"]>>(true);
  });

  it("handles class fields", () => {
    type Actual = Schema["instance"];

    type Expected = FieldDescriptor<Date | null, SomeErr>;

    assert<IsExact<Actual, Expected>>(true);
  });
});
