import { FieldDescriptor } from "../types/field-descriptor";
import { FormtsAction } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

export const makeValidationHandlers = <Values extends object, Err>(
  dispatch: React.Dispatch<FormtsAction<Values, Err>>
) => {
  const uuid = new Date().valueOf().toString();
  return {
    onFieldValidationStart: (field: FieldDescriptor<unknown, Err>) => {
      dispatch({
        type: "validatingStart",
        payload: { path: impl(field).__path, uuid },
      });
    },
    onFieldValidationEnd: (field: FieldDescriptor<unknown, Err>) => {
      dispatch({
        type: "validatingStop",
        payload: { path: impl(field).__path, uuid },
      });
    },
  };
};
