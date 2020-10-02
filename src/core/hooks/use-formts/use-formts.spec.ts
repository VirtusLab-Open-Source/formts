import { act, renderHook } from "@testing-library/react-hooks";

import { createFormSchema } from "../../builders/create-form-schema";

import { useFormts } from "./use-formts";

describe("use-formts", () => {
  const Schema = createFormSchema(fields => ({
    theString: fields.string(),
    theChoice: fields.choice("A", "B", "C"),
    theNum: fields.number(),
    theBool: fields.bool(),
    theInstance: fields.instanceOf(Date),
    theArray: fields.array(fields.string()),
    theObject: fields.object({ foo: fields.string() }),
  }));

  it("returns values initialized to defaults", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: "",
      theBool: false,
      theInstance: null,
      theArray: [],
      theObject: { foo: "" },
    });
  });

  it("returns values initialized to defaults merged with custom initial values", () => {
    const hook = renderHook(() =>
      useFormts({
        Schema,
        initialValues: {
          theChoice: "C",
          theNum: 42,
          theArray: ["here", "comes", "the", "sun"],
          theObject: { foo: "bar" },
        },
      })
    );

    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "C",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: ["here", "comes", "the", "sun"],
      theObject: { foo: "bar" },
    });
  });

  it("allows for getting values by corresponding FieldDescriptor", () => {
    const hook = renderHook(() =>
      useFormts({
        Schema,
        initialValues: {
          theChoice: "C",
          theNum: 42,
          theArray: ["here", "comes", "the", "sun"],

          theObject: { foo: "bar" },
        },
      })
    );

    const { getField } = hook.result.current;
    expect(getField(Schema.theChoice)).toEqual("C");
    expect(getField(Schema.theNum)).toEqual(42);
    expect(getField(Schema.theArray.root)).toEqual([
      "here",
      "comes",
      "the",
      "sun",
    ]);
    expect(getField(Schema.theArray.nth(42))).toEqual(undefined);
    expect(getField(Schema.theObject.root)).toEqual({ foo: "bar" });
    expect(getField(Schema.theObject.foo)).toEqual("bar");
  });

  it("allows for setting values by corresponding FieldDescriptor", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: "",
      theBool: false,
      theInstance: null,
      theArray: [],
      theObject: { foo: "" },
    });

    act(() => {
      hook.result.current.setField(Schema.theNum, 42);
    });
    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: [],
      theObject: { foo: "" },
    });

    act(() => {
      hook.result.current.setField(Schema.theArray.root, [
        "gumisie",
        "teletubisie",
      ]);
    });
    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: ["gumisie", "teletubisie"],
      theObject: { foo: "" },
    });

    act(() => {
      hook.result.current.setField(Schema.theObject.foo, "42");
    });
    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: ["gumisie", "teletubisie"],
      theObject: { foo: "42" },
    });
  });
});

// // dummy test for temporal implementation
// describe("use-formts", () => {
//   const Schema = createFormSchema(fields => ({
//     theString: fields.string(),
//     theChoice: fields.choice("A", "B", "C"),
//     theNum: fields.number(),
//     theBool: fields.bool(),
//     theArrayString: fields.array(fields.string()),
//     theArrayChoice: fields.array(fields.choice("a", "b", "c")),
//     theArrayArrayString: fields.array(fields.array(fields.string())),
//     theInstance: fields.instanceOf(Date),
//   }));

//   const { values, getField, setField } = useFormts({
//     Schema,
//     initialValues: {
//       theNum: 12,
//       theArrayArrayString: [["here"], ["comes", "the", "sun"]],
//       theArrayChoice: ["a"],
//     },
//   });

//   it("state is properly initialized", () => {
//     expect(values.theString).toEqual("");
//     expect(values.theChoice).toEqual("A");
//     expect(values.theNum).toEqual(12);
//     expect(values.theBool).toEqual(false);
//     expect(values.theArrayString).toEqual([]);
//     expect(values.theArrayChoice).toEqual(["a"]);
//     expect(values.theArrayArrayString).toEqual([
//       ["here"],
//       ["comes", "the", "sun"],
//     ]);
//     expect(values.theInstance).toEqual(null);
//   });

//   it("get should work for non-arrays", () => {
//     expect(getField(Schema.theString)).toEqual("");
//     expect(getField(Schema.theChoice)).toEqual("A");
//     expect(getField(Schema.theNum)).toEqual(12);
//     expect(getField(Schema.theBool)).toEqual(false);
//     expect(getField(Schema.theInstance)).toEqual(null);
//   });

//   it("get should work for one-element array", () => {
//     const root = getField(Schema.theArrayChoice.root);
//     assert<IsExact<typeof root, ("a" | "b" | "c")[]>>(true);

//     const first = getField(Schema.theArrayChoice.nth(0));
//     assert<IsExact<typeof first, "a" | "b" | "c">>(true);

//     expect(root).toEqual(["a"]);
//     expect(first).toEqual("a");
//     expect(getField(Schema.theArrayChoice.nth(1))).toEqual(undefined);
//   });

//   it("get should work for no-element array", () => {
//     const root = getField(Schema.theArrayString.root);
//     const first = getField(Schema.theArrayString.nth(0));

//     expect(root).toEqual([]);
//     expect(first).toEqual(undefined);
//   });

//   it("get should work for 2D array", () => {
//     const root = getField(Schema.theArrayArrayString.root);
//     const first = getField(Schema.theArrayArrayString.nth(0).root);
//     const firstOfFirst = getField(Schema.theArrayArrayString.nth(0).nth(0));

//     const second = getField(Schema.theArrayArrayString.nth(1).root);
//     const secondOfSecond = getField(Schema.theArrayArrayString.nth(1).nth(1));

//     const wrong = getField(Schema.theArrayArrayString.nth(19).nth(10));

//     expect(root).toEqual([["here"], ["comes", "the", "sun"]]);
//     expect(first).toEqual(["here"]);
//     expect(firstOfFirst).toEqual("here");

//     expect(second).toEqual(["comes", "the", "sun"]);
//     expect(secondOfSecond).toEqual("the");

//     expect(wrong).toEqual(undefined);
//   });

//   it("set should work for string", () => {
//     const shape = set(Schema.theString, "set");

//     expect(shape.theString).toEqual("set");
//     expect(shape.theChoice).toEqual("A");
//     expect(shape.theNum).toEqual(12);
//     expect(shape.theBool).toEqual(false);
//     expect(shape.theArrayString).toEqual([]);
//     expect(shape.theArrayChoice).toEqual(["a"]);
//     expect(shape.theArrayArrayString).toEqual([
//       ["here"],
//       ["comes", "the", "sun"],
//     ]);
//     expect(shape.theInstance).toEqual(null);
//   });

//   it("set should work for choice", () => {
//     // !TS will allow to pass any string here
//     const shape = set(Schema.theChoice, "C");

//     expect(shape.theString).toEqual("");
//     expect(shape.theChoice).toEqual("C");
//     expect(shape.theNum).toEqual(12);
//     expect(shape.theBool).toEqual(false);
//     expect(shape.theArrayString).toEqual([]);
//     expect(shape.theArrayChoice).toEqual(["a"]);
//     expect(shape.theArrayArrayString).toEqual([
//       ["here"],
//       ["comes", "the", "sun"],
//     ]);
//     expect(shape.theInstance).toEqual(null);
//   });

//   it("set should work for array", () => {
//     const shape = set(Schema.theArrayChoice.root, ["b", "b"]);

//     expect(shape.theString).toEqual("");
//     expect(shape.theChoice).toEqual("A");
//     expect(shape.theNum).toEqual(12);
//     expect(shape.theBool).toEqual(false);
//     expect(shape.theArrayString).toEqual([]);
//     expect(shape.theArrayChoice).toEqual(["b", "b"]);
//     expect(shape.theArrayArrayString).toEqual([
//       ["here"],
//       ["comes", "the", "sun"],
//     ]);
//     expect(shape.theInstance).toEqual(null);
//   });

//   it("set should work for array element", () => {
//     const shape = set(Schema.theArrayArrayString.nth(1).nth(1), "THE");

//     expect(shape.theArrayArrayString).toEqual([
//       ["here"],
//       ["comes", "THE", "sun"],
//     ]);
//   });

//   it("should work for nested objects", () => {
//     const Schema = createFormSchema(fields => ({
//       fridge: fields.object({
//         fruit: fields.array(fields.choice("banana", "berry", "kiwi")),
//         milk: fields.number(),
//       }),
//     }));

//     const [fields, get, set] = useFormts({
//       Schema,
//       initialValues: {
//         fridge: {
//           fruit: ["banana", "banana"],
//           milk: 10,
//         },
//       },
//     });

//     const fruit = fields.fridge.fruit;
//     expect(fruit).toEqual(["banana", "banana"]);

//     const milk = fields.fridge.milk;
//     expect(milk).toEqual(10);

//     expect(get(Schema.fridge.root)).toEqual({
//       fruit: ["banana", "banana"],
//       milk: 10,
//     });
//     expect(get(Schema.fridge.fruit.root)).toEqual(["banana", "banana"]);
//     expect(get(Schema.fridge.milk)).toEqual(10);

//     const shape1 = set(Schema.fridge.root, { fruit: ["berry"], milk: 12 });
//     expect(shape1.fridge).toEqual({ fruit: ["berry"], milk: 12 });

//     const shape2 = set(Schema.fridge.fruit.nth(0), "kiwi");
//     expect(shape2.fridge).toEqual({ fruit: ["kiwi", "banana"], milk: 10 });
//   });
// });
