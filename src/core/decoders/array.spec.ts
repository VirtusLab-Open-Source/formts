import { array } from "./array";
import { number } from "./number";
import { string } from "./string";

describe("array decoder", () => {
  it("should provide it's field type", () => {
    const decoder = array(string());

    expect(decoder.fieldType).toBe("array");
  });

  it("should provide initial field value", () => {
    const decoder = array(string());

    expect(decoder.init()).toEqual([]);
  });

  it("should expose inner decoder", () => {
    const inner = number();
    const decoder = array(inner);

    expect(decoder.inner).toBe(inner);
  });

  describe("combined with string decoder", () => {
    it("should decode empty arrays", () => {
      const decoder = array(string());

      expect(decoder.decode([])).toEqual({ ok: true, value: [] });
    });

    it("should decode string array", () => {
      const decoder = array(string());
      const value = ["foo", "bar", "baz", ""];

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode mixed array", () => {
      const decoder = array(string());
      const value = [null, "foo", 42, "", []];

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });
  });

  describe("combined with number decoder", () => {
    it("should decode empty arrays", () => {
      const decoder = array(number());

      expect(decoder.decode([])).toEqual({ ok: true, value: [] });
    });

    it("should decode number array", () => {
      const decoder = array(number());
      const value = [-1, 0, 10, 66.6];

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode mixed array", () => {
      const decoder = array(string());
      const value = [null, "foo", 42, "", []];

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });
  });

  describe("combined with another array decoder", () => {
    it("should decode empty arrays", () => {
      const decoder = array(array(string()));

      expect(decoder.decode([])).toEqual({ ok: true, value: [] });
      expect(decoder.decode([[]])).toEqual({ ok: true, value: [[]] });
    });

    it("should decode nested string array", () => {
      const decoder = array(array(string()));
      const value = [["", "foobar"], [], ["?"]];

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode mixed array", () => {
      const decoder = array(string());
      const value = [null, "foo", 42, "", []];

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });
  });
});
