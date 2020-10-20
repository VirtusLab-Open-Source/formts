import { assert, IsExact } from "conditional-type-checks";

import { impl } from "../types/type-mapper-util";

import { array } from "./array";
import { bool } from "./bool";
import { choice } from "./choice";
import { instanceOf } from "./instanceof";
import { number } from "./number";
import { object } from "./object";
import { string } from "./string";

describe("object decoder", () => {
  it("should force the user to provide object properties", () => {
    const invalidDecoder = object({});
    assert<IsExact<typeof invalidDecoder, void>>(true);
  });

  it("should provide it's field type", () => {
    const decoder = impl(object({ str: string() }));

    expect(decoder.fieldType).toBe("object");
  });

  it("should provide initial value composed from inner decoders", () => {
    const decoder = impl(
      object({
        bool: bool(),
        str: string(),
        num: number(),
        arr: array(string()),
        choice: choice("A", "B"),
      })
    );

    expect(decoder.init()).toEqual({
      bool: false,
      str: "",
      num: "",
      arr: [],
      choice: "A",
    });
  });

  it("should expose inner decoders", () => {
    const innerDecoders = {
      bool: bool(),
      str: string(),
      num: number(),
      arr: array(string()),
      choice: choice("A", "B"),
    };
    const decoder = impl(object(innerDecoders));

    expect(decoder.inner).toEqual(innerDecoders);
  });

  describe("combined with primitive decoders", () => {
    it("should decode valid object", () => {
      const decoder = impl(
        object({
          bool: bool(),
          str: string(),
          num: number(),
          choice: choice("A", "B"),
          instance: instanceOf(Date),
        })
      );

      const value = {
        bool: false,
        str: "foo",
        num: 42,
        choice: "B",
        instance: new Date(),
      };

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode invalid object", () => {
      const decoder = impl(
        object({
          bool: bool(),
          str: string(),
          num: number(),
          choice: choice("A", "B"),
          instance: instanceOf(Date),
        })
      );

      const value = {
        bool: false,
        str: "foo",
        num: 42,
        choice: "invalid choice",
        instance: new Date(),
      };

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });

    it("should NOT decode empty object", () => {
      const decoder = impl(
        object({
          bool: bool(),
          str: string(),
          num: number(),
          choice: choice("A", "B"),
          instance: instanceOf(Date),
        })
      );

      const value = {};

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });

    it("should NOT decode nulls", () => {
      const decoder = impl(
        object({
          bool: bool(),
          str: string(),
          num: number(),
          choice: choice("A", "B"),
          instance: instanceOf(Date),
        })
      );

      const value = null;

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });
  });

  describe("combined with nested arrays and objects", () => {
    it("should decode valid object", () => {
      const decoder = impl(
        object({
          arr: array(object({ bool: bool() })),
          obj: object({ arr: array(bool()) }),
        })
      );

      const value = {
        arr: [{ bool: true }, { bool: false }],
        obj: { arr: [false, true] },
      };

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode invalid object", () => {
      const decoder = impl(
        object({
          arr: array(object({ bool: bool() })),
          obj: object({ arr: array(bool()) }),
        })
      );

      const value = {
        arr: [{ bool: "huh?" }, { bool: false }],
        obj: { arr: [false, true] },
      };

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });
  });
});
