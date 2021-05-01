import { FormFields, FormSchemaBuilder } from "../builders";

import { createInitialValues } from "./create-initial-values";

describe("createInitialValues", () => {
  it("should be empty for empty schema", () => {
    // @ts-ignore
    const Schema = new FormSchemaBuilder().fields({}).build();

    expect(createInitialValues(Schema)).toEqual({});
  });

  it("for one-element schema", () => {
    const Schema = new FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
      })
      .build();

    expect(createInitialValues(Schema)).toEqual({ stringField: "" });
  });

  it("for multi-element schema", () => {
    const Schema = new FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
        boolField: FormFields.bool(),
        numberField: FormFields.number(),
        arrayField: FormFields.array(FormFields.number()),
        choiceField: FormFields.choice("Banana", "Avocado", "Cream"),
      })
      .build();

    expect(createInitialValues(Schema)).toEqual({
      stringField: "",
      boolField: false,
      numberField: "",
      arrayField: [],
      choiceField: "Banana",
    });
  });

  it("for multi-element schema with single-element init", () => {
    const Schema = new FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
        boolField: FormFields.bool(),
        numberField: FormFields.number(),
        arrayField: FormFields.array(FormFields.number()),
        choiceField: FormFields.choice("Banana", "Avocado", "Cream"),
      })
      .build();

    expect(createInitialValues(Schema, { stringField: "dodo" })).toEqual({
      stringField: "dodo",
      boolField: false,
      numberField: "",
      arrayField: [],
      choiceField: "Banana",
    });
  });

  it("for multi-element schema with multiple-element init", () => {
    const Schema = new FormSchemaBuilder()
      .fields({
        stringField: FormFields.string(),
        boolField: FormFields.bool(),
        numberField: FormFields.number(),
        arrayField: FormFields.array(FormFields.number()),
        choiceField: FormFields.choice("Banana", "Avocado", "Cream"),
      })
      .build();

    expect(
      createInitialValues(Schema, {
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
    const Schema = new FormSchemaBuilder()
      .fields({
        parent: FormFields.object({
          kain: FormFields.choice("Banana", "Spinach"),
          abel: FormFields.bool(),
        }),
      })
      .build();

    expect(createInitialValues(Schema, { parent: { abel: true } })).toEqual({
      parent: {
        kain: "Banana",
        abel: true,
      },
    });
  });

  it("for array of objects", () => {
    const Schema = new FormSchemaBuilder()
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
    createInitialValues(Schema, { arr: [{ two: [10] }] });

    expect(
      createInitialValues(Schema, { arr: [{ one: "foo", two: [10] }] })
    ).toEqual({
      arr: [{ one: "foo", two: [10] }],
    });
  });

  it("for date field", () => {
    const Schema = new FormSchemaBuilder()
      .fields({
        dateField: FormFields.date(),
      })
      .build();

    expect(
      createInitialValues(Schema, { dateField: Date.UTC(2021, 1, 1) })
    ).toEqual({ dateField: Date.UTC(2021, 1, 1) });
  });
});
