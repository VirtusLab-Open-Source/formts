import React from "react";

import { FormControl, _FormControlImpl } from "../../types/form-control";
import { FormtsOptions } from "../../types/formts-options";
import { opaque } from "../../types/type-mapper-util";

import { createFormtsMethods } from "./formts-methods";
import { createReducer, getInitialState } from "./formts-reducer";

export const useFormController = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): FormControl => {
  const [state, dispatch] = React.useReducer(
    createReducer<Values, Err>(),
    options,
    getInitialState
  );

  const methods = createFormtsMethods({ options, state, dispatch });

  const control: _FormControlImpl<Values, Err> = {
    __ctx: { options, state, methods },
  };

  return opaque(control);
};
