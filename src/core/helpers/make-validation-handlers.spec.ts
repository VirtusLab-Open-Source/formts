import { Future } from "../../utils/future";
import { FieldDescriptor } from "../types/field-descriptor";

import { makeValidationHandlers } from "./make-validation-handlers";

const enqueueTask = (task: () => void) => {
  setTimeout(task, 0);
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
    const syncValidationFlow = Future.all(
      Future.from(() => {
        onFieldValidationStart(field);
      }),
      Future.from(() => {
        onFieldValidationEnd(field);
      }),
      Future.from(() => {
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
    const asyncValidationFlow = Future.all(
      Future.from(() => {
        onFieldValidationStart(field);
      }),
      Future.make<void>(({ resolve }) => {
        enqueueTask(() => {
          onFieldValidationEnd(field);
          resolve();
        });
      }),
      Future.from(() => {
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
