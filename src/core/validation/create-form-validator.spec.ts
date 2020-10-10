import { assert, IsExact } from "conditional-type-checks";

import { createFormSchema } from "../builders/create-form-schema";

import { createFormValidator } from "./create-form-validator";
import { FormValidator } from "./types";

describe("createFormValidator", () => {
  const Schema = createFormSchema(
    fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
    }),
    errors => errors<"err1" | "err2">()
  );

  it("resolves ok", () => {
    //@ts-ignore
    const formValidator = createFormValidator(Schema, validate => []);

    type Actual = typeof formValidator;
    type Expected = FormValidator<
      {
        string: string;
        choice: "A" | "B" | "C";
        num: number | "";
        bool: boolean;
      },
      "err1" | "err2"
    >;

    assert<IsExact<Actual, Expected>>(true);
  });
});
