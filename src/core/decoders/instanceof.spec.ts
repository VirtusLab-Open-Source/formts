import { instanceOf } from "./instanceof";

describe("instanceOf decoder", () => {
  it("should provide it's field type", () => {
    const decoder = instanceOf(Set);

    expect(decoder.fieldType).toBe("class");
  });

  it("should provide initial field value", () => {
    const decoder = instanceOf(Date);

    expect(decoder.init()).toBeNull();
  });

  [Object, Array, String, Number, Boolean].forEach(constructor =>
    it(`should fail to instantiate using ${constructor.name} constructor`, () => {
      expect(() => instanceOf(constructor)).toThrowError();
    })
  );

  describe("combined with Date constructor", () => {
    it("should decode date instance", () => {
      const decoder = instanceOf(Date);
      const value = new Date();

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode strings", () => {
      const decoder = instanceOf(Date);
      const value = Date();

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });

    it("should NOT decode null", () => {
      const decoder = instanceOf(Date);
      const value = null;

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });
  });

  describe("combined with custom class", () => {
    class MyClass {
      constructor(public classy: boolean) {}
    }

    it("should decode class instance", () => {
      const decoder = instanceOf(MyClass);
      const value = new MyClass(true);

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode class-like objects", () => {
      const decoder = instanceOf(MyClass);
      const value: MyClass = { classy: false };

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });

    it("should NOT decode null", () => {
      const decoder = instanceOf(MyClass);
      const value = null;

      expect(decoder.decode(value)).toEqual({ ok: false, value });
    });
  });
});
