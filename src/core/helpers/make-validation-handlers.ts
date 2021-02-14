import type { Dispatch } from "react";

import { values } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FormtsAction } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

type Task = () => void;
type TaskCache = Record<string, Task | undefined>;

export const makeValidationHandlers = <Values extends object, Err>(
  dispatch: Dispatch<FormtsAction<Values, Err>>
) => {
  const uuid = generateSimpleUuid();
  let pendingStartDispatchers: TaskCache = {};

  return {
    /**  enqueues dispatch of 'validatingStart' action */
    onFieldValidationStart: (field: FieldDescriptor<unknown, Err>) => {
      const path = impl(field).__path;
      pendingStartDispatchers[path] = () => {
        dispatch({
          type: "validatingStart",
          payload: { path: impl(field).__path, uuid },
        });
      };
    },

    /**
     * if run before flush (sync validation scenario) - cancels out start action and no action is dispatched
     * if run after flush (async validation scenario) - dispatches 'validatingStop' action
     */
    onFieldValidationEnd: (field: FieldDescriptor<unknown, Err>) => {
      const path = impl(field).__path;

      if (pendingStartDispatchers[path]) {
        pendingStartDispatchers[path] = undefined;
      } else {
        dispatch({
          type: "validatingStop",
          payload: { path: impl(field).__path, uuid },
        });
      }
    },

    /**
     * Runs pending start dispatch.
     * Should be called after invoking validation function, but before awaiting it's finish
     */
    flushValidationHandlers: () => {
      values(pendingStartDispatchers).forEach(task => task?.());
      pendingStartDispatchers = {};
    },
  };
};

const generateSimpleUuid = () =>
  `${new Date().valueOf().toString()}#${Math.floor(Math.random() * 1000)}`;
