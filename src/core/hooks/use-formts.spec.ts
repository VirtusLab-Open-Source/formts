import { assert, IsExact } from "conditional-type-checks";

import { createFormSchema } from "../builders/create-form-schema";

import { useFormts } from "./use-formts";

// dummy test for temporal implementation
describe("use-formts", () => {
  const Schema = createFormSchema(fields => ({
    theString: fields.string(),
    theChoice: fields.choice("A", "B", "C"),
    theNum: fields.number(),
    theBool: fields.bool(),
    theArrayString: fields.array(fields.string()),
    theArrayChoice: fields.array(fields.choice("a", "b", "c")),
    theArrayArrayString: fields.array(fields.array(fields.string())),
    theInstance: fields.instanceOf(Date),
  }));

  const [fields, get, set] = useFormts({
    Schema,
    initialValues: {
      theNum: 12,
      theArrayArrayString: [["here"], ["comes", "the", "sun"]],
      theArrayChoice: ["a"],
    },
  });

  it("state is properly initialized", () => {
    expect(fields.theString).toEqual("");
    expect(fields.theChoice).toEqual("A");
    expect(fields.theNum).toEqual(12);
    expect(fields.theBool).toEqual(false);
    expect(fields.theArrayString).toEqual([]);
    expect(fields.theArrayChoice).toEqual(["a"]);
    expect(fields.theArrayArrayString).toEqual([
      ["here"],
      ["comes", "the", "sun"],
    ]);
    expect(fields.theInstance).toEqual(null);
  });

  it("get should work for non-arrays", () => {
    expect(get(Schema.theString)).toEqual("");
    expect(get(Schema.theChoice)).toEqual("A");
    expect(get(Schema.theNum)).toEqual(12);
    expect(get(Schema.theBool)).toEqual(false);
    expect(get(Schema.theInstance)).toEqual(null);
  });

  it("get should work for one-element array", () => {
    const root = get(Schema.theArrayChoice.root);
    assert<IsExact<typeof root, ("a" | "b" | "c")[]>>(true);

    const first = get(Schema.theArrayChoice.nth(0));
    assert<IsExact<typeof first, "a" | "b" | "c">>(true);

    expect(root).toEqual(["a"]);
    expect(first).toEqual("a");
    expect(get(Schema.theArrayChoice.nth(1))).toEqual(undefined);
  });

  it("get should work for no-element array", () => {
    const root = get(Schema.theArrayString.root);
    const first = get(Schema.theArrayString.nth(0));

    expect(root).toEqual([]);
    expect(first).toEqual(undefined);
  });

  it("get should work for 2D array", () => {
    const root = get(Schema.theArrayArrayString.root);
    const first = get(Schema.theArrayArrayString.nth(0).root);
    const firstOfFirst = get(Schema.theArrayArrayString.nth(0).nth(0));

    const second = get(Schema.theArrayArrayString.nth(1).root);
    const secondOfSecond = get(Schema.theArrayArrayString.nth(1).nth(1));

    const wrong = get(Schema.theArrayArrayString.nth(19).nth(10));

    expect(root).toEqual([["here"], ["comes", "the", "sun"]]);
    expect(first).toEqual(["here"]);
    expect(firstOfFirst).toEqual("here");

    expect(second).toEqual(["comes", "the", "sun"]);
    expect(secondOfSecond).toEqual("the");

    expect(wrong).toEqual(undefined);
  });

  it("set should work for string", () => {
    const shape = set(Schema.theString, "set");

    expect(shape.theString).toEqual("set");
    expect(shape.theChoice).toEqual("A");
    expect(shape.theNum).toEqual(12);
    expect(shape.theBool).toEqual(false);
    expect(shape.theArrayString).toEqual([]);
    expect(shape.theArrayChoice).toEqual(["a"]);
    expect(shape.theArrayArrayString).toEqual([
      ["here"],
      ["comes", "the", "sun"],
    ]);
    expect(shape.theInstance).toEqual(null);
  });

  it("set should work for choice", () => {
    // !TS will allow to pass any string here
    const shape = set(Schema.theChoice, "C");

    expect(shape.theString).toEqual("");
    expect(shape.theChoice).toEqual("C");
    expect(shape.theNum).toEqual(12);
    expect(shape.theBool).toEqual(false);
    expect(shape.theArrayString).toEqual([]);
    expect(shape.theArrayChoice).toEqual(["a"]);
    expect(shape.theArrayArrayString).toEqual([
      ["here"],
      ["comes", "the", "sun"],
    ]);
    expect(shape.theInstance).toEqual(null);
  });

  it("set should work for array", () => {
    const shape = set(Schema.theArrayChoice.root, ["b", "b"]);

    expect(shape.theString).toEqual("");
    expect(shape.theChoice).toEqual("A");
    expect(shape.theNum).toEqual(12);
    expect(shape.theBool).toEqual(false);
    expect(shape.theArrayString).toEqual([]);
    expect(shape.theArrayChoice).toEqual(["b", "b"]);
    expect(shape.theArrayArrayString).toEqual([
      ["here"],
      ["comes", "the", "sun"],
    ]);
    expect(shape.theInstance).toEqual(null);
  });

  it("set should work for array element", () => {
    const shape = set(Schema.theArrayArrayString.nth(1).nth(1), "THE");

    expect(shape.theArrayArrayString).toEqual([
      ["here"],
      ["comes", "THE", "sun"],
    ]);
  });
});
