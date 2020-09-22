import { assert, IsExact } from "conditional-type-checks";

import { DecoderResult, FieldDecoder, FieldType } from "./field-decoder";

describe("FieldDecoder type", () => {
  it("handles string fields", () => {
    type Actual = FieldDecoder<string>;
    type Expected = {
      fieldType: FieldType;
      init: () => string;
      decode: (val: unknown) => DecoderResult<string>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles number fields", () => {
    type Actual = FieldDecoder<number | "">;
    type Expected = {
      fieldType: FieldType;
      init: () => number | "";
      decode: (val: unknown) => DecoderResult<number | "">;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles boolean fields", () => {
    type Actual = FieldDecoder<boolean>;
    type Expected = {
      fieldType: FieldType;
      init: () => boolean;
      decode: (val: unknown) => DecoderResult<boolean>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles choice fields", () => {
    type Actual = FieldDecoder<"A" | "B" | "C">;
    type Expected = {
      fieldType: FieldType;
      options: Array<"A" | "B" | "C">;
      init: () => "A" | "B" | "C";
      decode: (val: unknown) => DecoderResult<"A" | "B" | "C">;
    };

    assert<IsExact<Actual, Expected>>(true);
  });

  it("handles array fields", () => {
    type Actual = FieldDecoder<string[]>;
    type Expected = {
      fieldType: FieldType;
      inner: FieldDecoder<string>;
      init: () => string[];
      decode: (val: unknown) => DecoderResult<string[]>;
    };

    assert<IsExact<Actual, Expected>>(true);
  });
});
