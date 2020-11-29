import { IsExact, assert } from "conditional-type-checks";

import { FieldDescriptor } from "./field-descriptor";
import { FormSchema, ExtractFormValues } from "./form-schema";

type SomeValues = {
  string: string;
  choice: "A" | "B" | "C";
  num: number | "";
  bool: boolean;
  arrayString: string[];
  arrayChoice: Array<"A" | "B" | "C">;
  arrayArrayString: string[][];
  obj: { string: string };
  objObj: { nested: { num: number | "" } };
  objObjArray: { nested: { arrayString: string[] } };
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
      | "objObj"
      | "objObjArray"
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

    type Expected = FieldDescriptor<string[], SomeErr> & {
      nth: (index: number) => FieldDescriptor<string, SomeErr>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles nested array fields", () => {
    type Actual = Schema["arrayArrayString"];

    type Expected = FieldDescriptor<string[][], SomeErr> & {
      nth: (
        index: number
      ) => FieldDescriptor<string[], SomeErr> & {
        nth: (index: number) => FieldDescriptor<string, SomeErr>;
      };
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles object fields", () => {
    type Actual = Schema["obj"];

    type Expected = FieldDescriptor<{ string: string }, SomeErr> & {
      string: FieldDescriptor<string, SomeErr>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles nested object fields", () => {
    type Actual = Schema["objObj"];

    type Expected = FieldDescriptor<
      { nested: { num: number | "" } },
      SomeErr
    > & {
      nested: FieldDescriptor<{ num: number | "" }, SomeErr> & {
        num: FieldDescriptor<number | "", SomeErr>;
      };
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles deeply nested array fields", () => {
    type Actual = Schema["objObjArray"];

    type Expected = FieldDescriptor<
      { nested: { arrayString: string[] } },
      SomeErr
    > & {
      nested: FieldDescriptor<{ arrayString: string[] }, SomeErr> & {
        arrayString: FieldDescriptor<string[], SomeErr> & {
          nth: (index: number) => FieldDescriptor<string, SomeErr>;
        };
      };
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles array of objects", () => {
    type Actual = Schema["arrayObj"];

    type Expected = FieldDescriptor<Array<{ string: string }>, SomeErr> & {
      nth: (
        index: number
      ) => FieldDescriptor<{ string: string }, SomeErr> & {
        string: FieldDescriptor<string, SomeErr>;
      };
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles class fields", () => {
    type Actual = Schema["instance"];

    type Expected = FieldDescriptor<Date | null, SomeErr>;

    assert<IsExact<Actual, Expected>>(true);
  });
});

describe("ExtractFormValues type", () => {
  it("extracts type of form values out of FormSchema type", () => {
    type Schema = FormSchema<SomeValues, SomeErr>;

    type Actual = ExtractFormValues<Schema>;
    type Expected = SomeValues;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves to never for invalid input", () => {
    type Actual = ExtractFormValues<{}>;
    type Expected = never;

    assert<IsExact<Actual, Expected>>(true);
  });
});
