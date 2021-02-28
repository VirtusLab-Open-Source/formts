import { GenericFieldDescriptor } from "./field-descriptor";
import { FormHandle } from "./form-handle";

describe("FormHandle type", () => {
  describe(".setFieldValue", () => {
    it("only allows passing values assignable to type imposed by given FieldDescriptor", () => {
      const handle: FormHandle<{}, "ERR"> = {} as any;
      const field: GenericFieldDescriptor<"A" | "B", "ERR"> = {} as any;

      () => {
        handle.setFieldValue(field, "A");

        handle.setFieldValue(field, "B");

        // @ts-expect-error
        handle.setFieldValue(field, "C");
      };
    });

    it("only works for fields with matching Err type parameter", () => {
      const handle: FormHandle<{}, "ERR1"> = {} as any;
      const field: GenericFieldDescriptor<string, "ERR2"> = {} as any;

      () => {
        // @ts-expect-error
        handle.setFieldValue(field, "A");

        // @ts-expect-error
        handle.setFieldValue(field, "B");
      };
    });
  });

  describe(".setFieldError", () => {
    it("only works for fields with matching Err type parameter", () => {
      const handle: FormHandle<{}, "ERR1"> = {} as any;
      const field: GenericFieldDescriptor<string, "ERR2"> = {} as any;

      () => {
        // @ts-expect-error
        handle.setFieldError(field, "ERR1");
      };
    });

    it("only works for errors matching Err type parameter", () => {
      const handle: FormHandle<{}, "ERR1"> = {} as any;
      const field: GenericFieldDescriptor<string, "ERR1"> = {} as any;

      () => {
        // @ts-expect-error
        handle.setFieldError(field, "ERR2");
      };
    });
  });
});
