import { createFormSchema } from "../../builders/create-form-schema";

import { createInitialValues } from "./create-initial-values";

describe("createInitialValues", () => {
  it("should be empty for empty schema", () => {
    expect(createInitialValues({})).toEqual({});
  });

  it("for one-element schema", () => {
    const schema = createFormSchema(fields => ({
      stringField: fields.string(),
    }));

    expect(createInitialValues(schema)).toEqual({ stringField: "" });
  });

  it("for multi-element schema", () => {
    const schema = createFormSchema(fields => ({
      stringField: fields.string(),
      boolField: fields.bool(),
      numberField: fields.number(),
      arrayField: fields.array(fields.number()),
      choiceField: fields.choice("Banana", "Avocado", "Cream"),
    }));

    expect(createInitialValues(schema)).toEqual({
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

    expect(createInitialValues(schema, { stringField: "dodo" })).toEqual({
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
      createInitialValues(schema, {
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

    expect(createInitialValues(schema, { parent: { abel: true } })).toEqual({
      parent: {
        kain: "Banana",
        abel: true,
      },
    });
  });

  it("for array of objects", () => {
    const schema = createFormSchema(fields => ({
      arr: fields.array(
        fields.object({
          one: fields.string(),
          two: fields.array(fields.number()),
        })
      ),
    }));

    expect(createInitialValues(schema, { arr: [{ two: [10] }] })).toEqual({
      arr: [{ two: [10] }],
    });
  });
});
