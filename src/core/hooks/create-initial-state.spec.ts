import { createFormSchema } from "../builders/create-form-schema";

import { createInitialState } from "./create-initial-state";

describe("create-initial-state", () => {
  it("should be empty for empty schema", () => {
    expect(createInitialState({})).toEqual({});
  });

  it("for one-element schema", () => {
    const schema = createFormSchema(fields => ({
      stringField: fields.string(),
    }));

    expect(createInitialState(schema)).toEqual({ stringField: "" });
  });

  it("for one-element schema", () => {
    const schema = createFormSchema(fields => ({
      stringField: fields.string(),
    }));

    expect(createInitialState(schema)).toEqual({ stringField: "" });
  });

  it("for multi-element schema", () => {
    const schema = createFormSchema(fields => ({
      stringField: fields.string(),
      boolField: fields.bool(),
      numberField: fields.number(),
      arrayField: fields.array(fields.number()),
      choiceField: fields.choice("Banana", "Avocado", "Cream"),
    }));

    expect(createInitialState(schema)).toEqual({
      stringField: "",
      boolField: false,
      numberField: "",
      arrayField: [],
      choiceField: "Banana",
    });
  });

  it("for multi-element schema with single-element init", () => {
    const schema = createFormSchema(fields => ({
      stringField: fields.string(),
      boolField: fields.bool(),
      numberField: fields.number(),
      arrayField: fields.array(fields.number()),
      choiceField: fields.choice("Banana", "Avocado", "Cream"),
    }));

    expect(createInitialState(schema, { stringField: "dodo" })).toEqual({
      stringField: "dodo",
      boolField: false,
      numberField: "",
      arrayField: [],
      choiceField: "Banana",
    });
  });

  it("for multi-element schema with multiple-element init", () => {
    const schema = createFormSchema(fields => ({
      stringField: fields.string(),
      boolField: fields.bool(),
      numberField: fields.number(),
      arrayField: fields.array(fields.number()),
      choiceField: fields.choice("Banana", "Avocado", "Cream"),
    }));

    expect(
      createInitialState(schema, {
        stringField: "dodo",
        boolField: true,
        numberField: 0,
        arrayField: [1, 2, 3],
        choiceField: "Cream",
      })
    ).toEqual({
      stringField: "dodo",
      boolField: true,
      numberField: 0,
      arrayField: [1, 2, 3],
      choiceField: "Cream",
    });
  });

  it("for nested-object", () => {
    const schema = createFormSchema(fields => ({
      parent: fields.object({
        kain: fields.choice("Banana", "Spinach"),
        abel: fields.bool(),
      }),
    }));

    expect(createInitialState(schema, { parent: { abel: true } })).toEqual({
      parent: {
        kain: "Banana",
        abel: true,
      },
    });
  });
});
