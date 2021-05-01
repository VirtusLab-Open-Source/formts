import { FormFields, FormSchemaBuilder } from "../builders";

import { createInitialValues } from "./create-initial-values";

describe("createInitialValues", () => {
  it("should be empty for empty schema", () => {
    // @ts-ignore
    const schema = FormSchemaBuilder().fields({}).build();

    expect(createInitialValues(schema)).toEqual({});
  });

  it("for one-element schema", () => {
    const schema = FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
      })
      .build();

    expect(createInitialValues(schema)).toEqual({ stringField: "" });
  });

  it("for multi-element schema", () => {
    const schema = FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
        boolField: FormFields.bool(),
        numberField: FormFields.number(),
        arrayField: FormFields.array(FormFields.number()),
        choiceField: FormFields.choice("Banana", "Avocado", "Cream"),
      })
      .build();

    expect(createInitialValues(schema)).toEqual({
      stringField: "",
      boolField: false,
      numberField: "",
      arrayField: [],
      choiceField: "Banana",
    });
  });

  it("for multi-element schema with single-element init", () => {
    const schema = FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
        boolField: FormFields.bool(),
        numberField: FormFields.number(),
        arrayField: FormFields.array(FormFields.number()),
        choiceField: FormFields.choice("Banana", "Avocado", "Cream"),
      })
      .build();

    expect(createInitialValues(schema, { stringField: "dodo" })).toEqual({
      stringField: "dodo",
      boolField: false,
      numberField: "",
      arrayField: [],
      choiceField: "Banana",
    });
  });

  it("for multi-element schema with multiple-element init", () => {
    const schema = FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
        boolField: FormFields.bool(),
        numberField: FormFields.number(),
        arrayField: FormFields.array(FormFields.number()),
        choiceField: FormFields.choice("Banana", "Avocado", "Cream"),
      })
      .build();

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
    const schema = FormSchemaBuilder()
      .fields({
        parent: FormFields.object({
          kain: FormFields.choice("Banana", "Spinach"),
          abel: FormFields.bool(),
        }),
      })
      .build();

    expect(createInitialValues(schema, { parent: { abel: true } })).toEqual({
      parent: {
        kain: "Banana",
        abel: true,
      },
    });
  });

  it("for array of objects", () => {
    const schema = FormSchemaBuilder()
      .fields({
        arr: FormFields.array(
          FormFields.object({
            one: FormFields.string(),
            two: FormFields.array(FormFields.number()),
          })
        ),
      })
      .build();

    // @ts-expect-error
    createInitialValues(schema, { arr: [{ two: [10] }] });

    expect(
      createInitialValues(schema, { arr: [{ one: "foo", two: [10] }] })
    ).toEqual({
      arr: [{ one: "foo", two: [10] }],
    });
  });

  it("for date field", () => {
    const schema = FormSchemaBuilder()
      .fields({
        dateField: FormFields.date(),
      })
      .build();

    expect(
      createInitialValues(schema, { dateField: Date.UTC(2021, 1, 1) })
    ).toEqual({ dateField: Date.UTC(2021, 1, 1) });
  });
});
