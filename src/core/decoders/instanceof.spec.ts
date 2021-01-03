import { impl } from "../types/type-mapper-util";

import { instanceOf } from "./instanceof";

describe("instanceOf decoder", () => {
  it("should provide it's field type", () => {
    const decoder = impl(instanceOf(Set));

    expect(decoder.fieldType).toBe("class");
  });

  it("should provide it's field instance constructor", () => {
    const decoder = impl(instanceOf(Set));

    expect(decoder.instanceConstructor).toBe(Set);
  });

  it("should provide initial field value", () => {
    const decoder = impl(instanceOf(Date));

    expect(decoder.init()).toBeNull();
  });

  [Object, Array, String, Number, Boolean].forEach(constructor =>
    it(`should fail to instantiate using ${constructor.name} constructor`, () => {
      expect(() => instanceOf(constructor)).toThrowError();
    })
  );

  describe("combined with Date constructor", () => {
    it("should decode date instance", () => {
      const decoder = impl(instanceOf(Date));
      const value = new Date();

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should decode null", () => {
      const decoder = impl(instanceOf(Date));
      const value = null;

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should NOT decode undefined", () => {
      const decoder = impl(instanceOf(Date));
      const value = undefined;

      expect(decoder.decode(value)).toEqual({ ok: false });
    });

    it("should NOT decode strings", () => {
      const decoder = impl(instanceOf(Date));
      const value = Date();

      expect(decoder.decode(value)).toEqual({ ok: false });
    });
  });

  describe("combined with custom class", () => {
    class MyClass {
      constructor(public classy: boolean) {}
    }

    it("should decode class instance", () => {
      const decoder = impl(instanceOf(MyClass));
      const value = new MyClass(true);

      expect(decoder.decode(value)).toEqual({ ok: true, value });
    });

    it("should decode null", () => {
      const decoder = impl(instanceOf(MyClass));
      const value = null;

      expect(decoder.decode(value)).toEqual({ ok: true, value: null });
    });

    it("should NOT decode undefined", () => {
      const decoder = impl(instanceOf(MyClass));
      const value = undefined;

      expect(decoder.decode(value)).toEqual({ ok: false });
    });

    it("should NOT decode class-like objects", () => {
      const decoder = impl(instanceOf(MyClass));
      const value: MyClass = { classy: false };

      expect(decoder.decode(value)).toEqual({ ok: false });
    });
  });
});
