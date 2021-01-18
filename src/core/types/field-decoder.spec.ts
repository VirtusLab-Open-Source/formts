import { assert, IsExact } from "conditional-type-checks";

import { DecoderResult, _FieldDecoderImpl, FieldType } from "./field-decoder";

describe("_FieldDecoderImpl type", () => {
  it("handles string fields", () => {
    type Actual = _FieldDecoderImpl<string>;
    type Expected = {
      fieldType: FieldType;
      init: () => string;
      decode: (val: unknown) => DecoderResult<string>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles number fields", () => {
    type Actual = _FieldDecoderImpl<number | "">;
    type Expected = {
      fieldType: FieldType;
      init: () => number | "";
      decode: (val: unknown) => DecoderResult<number | "">;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles boolean fields", () => {
    type Actual = _FieldDecoderImpl<boolean>;
    type Expected = {
      fieldType: FieldType;
      init: () => boolean;
      decode: (val: unknown) => DecoderResult<boolean>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles choice fields", () => {
    type Actual = _FieldDecoderImpl<"A" | "B" | "C">;
    type Expected = {
      fieldType: FieldType;
      options: Array<"A" | "B" | "C">;
      init: () => "A" | "B" | "C";
      decode: (val: unknown) => DecoderResult<"A" | "B" | "C">;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles date fields", () => {
    type Actual = _FieldDecoderImpl<Date | null>;
    type Expected = {
      fieldType: FieldType;
      init: () => Date | null;
      decode: (val: unknown) => DecoderResult<Date | null>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles array fields", () => {
    type Actual = _FieldDecoderImpl<string[]>;
    type Expected = {
      fieldType: FieldType;
      inner: _FieldDecoderImpl<string>;
      init: () => string[];
      decode: (val: unknown) => DecoderResult<string[]>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles object fields", () => {
    type Actual = _FieldDecoderImpl<{
      str: string;
      num: number | "";
      arr: boolean[];
      nested: { str: string };
    }>;

    type Expected = {
      fieldType: FieldType;

      inner: {
        str: _FieldDecoderImpl<string>;
        num: _FieldDecoderImpl<number | "">;
        arr: _FieldDecoderImpl<boolean[]>;
        nested: _FieldDecoderImpl<{ str: string }>;
      };

      init: () => {
        str: string;
        num: number | "";
        arr: boolean[];
        nested: { str: string };
      };

      decode: (
        val: unknown
      ) => DecoderResult<{
        str: string;
        num: number | "";
        arr: boolean[];
        nested: { str: string };
      }>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });
});
