import { TouchedValues } from "../../types/formts-state";

// action for internal reducer
export type FormtsAction<Values> =
  | { type: "setValues"; payload: { values: Values } }
  | { type: "setTouched"; payload: { touched: TouchedValues<Values> } }
  | { type: "updateValue"; payload: { path: string; value: any } };
