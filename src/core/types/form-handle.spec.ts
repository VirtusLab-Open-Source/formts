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
      const handle: FormHandle<{}, "ERR_1"> = {} as any;
      const field1: GenericFieldDescriptor<string, "ERR_1"> = {} as any;
      const field2: GenericFieldDescriptor<string, "ERR_2"> = {} as any;

      () => {
        handle.setFieldValue(field1, "A");

        // @ts-expect-error
        handle.setFieldValue(field2, "A");
      };
    });
  });

  describe(".setFieldError", () => {
    it("only works for fields with matching Err type parameter", () => {
      const handle: FormHandle<{}, "ERR_1"> = {} as any;
      const field1: GenericFieldDescriptor<string, "ERR_1"> = {} as any;
      const field2: GenericFieldDescriptor<string, "ERR_2"> = {} as any;

      () => {
        handle.setFieldError(field1, "ERR_1");

        // @ts-expect-error
        handle.setFieldError(field2, "ERR_1");
      };
    });

    it("only works for errors matching Err type parameter", () => {
      const handle: FormHandle<{}, "ERR_1"> = {} as any;
      const field: GenericFieldDescriptor<string, "ERR_1"> = {} as any;

      () => {
        handle.setFieldError(field, "ERR_1");

        // @ts-expect-error
        handle.setFieldError(field, "ERR_2");
      };
    });
  });
});
