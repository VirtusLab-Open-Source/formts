import React from "react";

import {
  FormController,
  _FormControllerImpl,
} from "../../types/form-controller";
import { FormtsOptions } from "../../types/formts-options";
import { opaque } from "../../types/type-mapper-util";

import { createFormtsMethods } from "./formts-methods";
import { createReducer, getInitialState } from "./formts-reducer";

export const useFormController = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): FormController => {
  const [state, dispatch] = React.useReducer(
    createReducer<Values, Err>(),
    options,
    getInitialState
  );

  const methods = createFormtsMethods({ options, state, dispatch });

  const controller: _FormControllerImpl<Values, Err> = {
    __ctx: { options, state, methods },
  };

  return opaque(controller);
};
