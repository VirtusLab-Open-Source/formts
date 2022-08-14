import type { Dispatch } from "react";

import { keys } from "../../utils";
import { FormtsAction } from "../types/formts-state";

type FieldPath = string;

export const makeValidationHandlers = <Err>(
  dispatch: Dispatch<FormtsAction<Err>>
) => {
  const uuid = generateSimpleUuid();
  let pendingValidationStartFields: Record<FieldPath, true> = {};

  return {
    /**  enqueues dispatch of 'validatingStart' action */
    onFieldValidationStart: (fieldPath: FieldPath) => {
      pendingValidationStartFields[fieldPath] = true;
    },

    /**
     * if run before flush (sync validation scenario) - cancels out start action and no action is dispatched
     * if run after flush (async validation scenario) - dispatches 'validatingStop' action
     */
    onFieldValidationEnd: (fieldPath: FieldPath) => {
      if (pendingValidationStartFields[fieldPath]) {
        delete pendingValidationStartFields[fieldPath];
      } else {
        dispatch({
          type: "validatingStop",
          payload: { path: fieldPath, uuid },
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
