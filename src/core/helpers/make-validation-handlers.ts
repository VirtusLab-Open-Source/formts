import type { Dispatch } from "react";

import { keys } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FormtsAction } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

type FieldPath = string;

export const makeValidationHandlers = <Values extends object, Err>(
  dispatch: Dispatch<FormtsAction<Values, Err>>
) => {
  const uuid = generateSimpleUuid();
  let pendingValidationStartFields: Record<FieldPath, true> = {};

  return {
    /**  enqueues dispatch of 'validatingStart' action */
    onFieldValidationStart: (field: FieldDescriptor<unknown, Err>) => {
      const path = impl(field).__path;
      pendingValidationStartFields[path] = true;
    },

    /**
     * if run before flush (sync validation scenario) - cancels out start action and no action is dispatched
     * if run after flush (async validation scenario) - dispatches 'validatingStop' action
     */
    onFieldValidationEnd: (field: FieldDescriptor<unknown, Err>) => {
      const path = impl(field).__path;

      if (pendingValidationStartFields[path]) {
        delete pendingValidationStartFields[path];
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
      keys(pendingValidationStartFields).forEach(path => {
        dispatch({
          type: "validatingStart",
          payload: { path, uuid },
        });
      });
      pendingValidationStartFields = {};
    },
  };
};

const generateSimpleUuid = () =>
  `${new Date().valueOf().toString()}#${Math.floor(Math.random() * 1000)}`;
