import { Task } from "../../utils/task";
import { FieldDescriptor } from "../types/field-descriptor";

import { makeValidationHandlers } from "./make-validation-handlers";

const enqueueEffect = (effect: () => void) => {
  setTimeout(effect, 0);
};

describe("makeValidationHandlers", () => {
  it("does not dispatch any actions for sync validation flow", async () => {
    const dispatch = jest.fn();
    const field: FieldDescriptor<any, any> = { __path: "path" } as any;

    const {
      onFieldValidationStart,
      onFieldValidationEnd,
      flushValidationHandlers,
    } = makeValidationHandlers(dispatch);

    // onFieldValidationEnd is called before flushValidationHandlers
    const syncValidationFlow = Task.all(
      Task.from(() => {
        onFieldValidationStart(field);
      }),
      Task.from(() => {
        onFieldValidationEnd(field);
      }),
      Task.from(() => {
        flushValidationHandlers();
      })
    );

    await syncValidationFlow.runPromise();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("dispatches validating{Start|End} actions for async validation flow", async () => {
    const dispatch = jest.fn();
    const field: FieldDescriptor<any, any> = { __path: "path" } as any;

    const {
      onFieldValidationStart,
      onFieldValidationEnd,
      flushValidationHandlers,
    } = makeValidationHandlers(dispatch);

    // onFieldValidationEnd is called after flushValidationHandlers
    const asyncValidationFlow = Task.all(
      Task.from(() => {
        onFieldValidationStart(field);
      }),
      Task.make<void>(({ resolve }) => {
        enqueueEffect(() => {
          onFieldValidationEnd(field);
          resolve();
        });
      }),
      Task.from(() => {
        flushValidationHandlers();
      })
    );

    await asyncValidationFlow.runPromise();

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "validatingStart" })
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "validatingStop" })
    );
  });
});
