import { IsExact, assert } from "conditional-type-checks";

import { TouchedValues } from "./formts-state";

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
  date: Date | null;
};

describe("TouchedValues type", () => {
  type Touched = TouchedValues<SomeValues>;

  it("is an object with a key for every input object key", () => {
    type Actual = keyof Touched;
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
      | "date";

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles string fields", () => {
    type Actual = Touched["string"];
    type Expected = boolean;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles choice fields", () => {
    type Actual = Touched["choice"];
    type Expected = boolean;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles number fields", () => {
    type Actual = Touched["num"];
    type Expected = boolean;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles boolean fields", () => {
    type Actual = Touched["bool"];
    type Expected = boolean;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles array fields", () => {
    type Actual = Touched["arrayString"];
    type Expected = boolean[];

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles nested array fields", () => {
    type Actual = Touched["arrayArrayString"];
    type Expected = boolean[][];

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles object fields", () => {
    type Actual = Touched["obj"];
    type Expected = { string: boolean };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles nested object fields", () => {
    type Actual = Touched["objObj"];
    type Expected = { nested: { num: boolean } };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles deeply nested array fields", () => {
    type Actual = Touched["objObjArray"];
    type Expected = { nested: { arrayString: boolean[] } };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles array of objects", () => {
    type Actual = Touched["arrayObj"];
    type Expected = Array<{ string: boolean }>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles date fields", () => {
    type Actual = Touched["date"];
    type Expected = boolean;

    assert<IsExact<Actual, Expected>>(true);
  });
});
