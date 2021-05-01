import * as Decoders from "../decoders";

export const FormFields = {
  bool: Decoders.bool,
  string: Decoders.string,
  number: Decoders.number,
  choice: Decoders.choice,
  date: Decoders.date,
  array: Decoders.array,
  object: Decoders.object,
};

export type FormFields = typeof FormFields;
