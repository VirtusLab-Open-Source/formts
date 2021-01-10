import { ChangeEvent } from "react";

import {
  _FieldDecoderImpl,
  DecoderResult,
  _ArrayFieldDecoderImpl,
  isArrayDecoder,
} from "../types/field-decoder";

enum HtmlInputTypes {
  Radio = "radio",
  Checkbox = "checkbox",

  SelectOne = "select-one",
  SelectMultiple = "select-multiple",

  Date = "date",
  DateTimeLocal = "datetime-local",
  DateTime = "datetime",
  Month = "month",
  Time = "time",
}

type SimplifiedEventTarget = {
  type: string;
  value: unknown;
  checked?: boolean;
  valueAsNumber?: number;
  options?: Array<{ selected: boolean; value: unknown }>;
};

type Input<T> = {
  fieldDecoder: _FieldDecoderImpl<T>;
  getValue: () => T;
  event: ChangeEvent<unknown>;
};

export const decodeChangeEvent = <T>({
  fieldDecoder,
  getValue,
  event,
}: Input<T>): DecoderResult<T> => {
  const target = parseEventTarget(event);

  if (!target) {
    return { ok: false };
  }

  switch (target.type) {
    case HtmlInputTypes.Radio:
      return target.checked ? fieldDecoder.decode(target.value) : { ok: false };

    case HtmlInputTypes.Checkbox:
      switch (fieldDecoder.fieldType) {
        case "bool":
          return fieldDecoder.decode(target.checked);
        case "array": {
          return fieldDecoder.decode(
            resolveCheckboxArrayValue(target, fieldDecoder, getValue() as any)
          );
        }

        default:
          return { ok: false };
      }

    case HtmlInputTypes.SelectMultiple: {
      switch (fieldDecoder.fieldType) {
        case "array": {
          return fieldDecoder.decode(
            target.options?.filter(opt => opt.selected).map(opt => opt.value)
          );
        }

        default:
          return { ok: false };
      }
    }

    case HtmlInputTypes.Date:
    case HtmlInputTypes.DateTimeLocal:
    case HtmlInputTypes.DateTime:
    case HtmlInputTypes.Month:
    case HtmlInputTypes.Time:
      switch (fieldDecoder.fieldType) {
        case "date":
        case "number":
          return fieldDecoder.decode(target.valueAsNumber);
        default:
          return fieldDecoder.decode(target.value);
      }

    default:
      return fieldDecoder.decode(target.value);
  }
};

const parseEventTarget = ({
  target,
}: ChangeEvent<any>): SimplifiedEventTarget | null =>
  target
    ? {
        type: target.type ?? "",
        value: target.value,
        checked: target.checked,
        valueAsNumber: target.valueAsNumber,
        options: target.options
          ? parseSelectOptions(target.options)
          : undefined,
      }
    : null;

const parseSelectOptions = (options: HTMLOptionsCollection) =>
  Array.from(options).map(it => ({
    selected: it.selected,
    value: it.value,
  }));

const resolveCheckboxArrayValue = <T>(
  target: SimplifiedEventTarget,
  decoder: _FieldDecoderImpl<unknown>,
  currentValue: T[]
): T[] | null => {
  if (!isArrayDecoder(decoder)) {
    return null;
  }

  const elementResult = decoder.inner.decode(target.value);

  if (!elementResult.ok) {
    return null;
  }
  const element = elementResult.value as T;

  if (target.checked) {
    return [...currentValue, element];
  } else {
    return currentValue.filter(it => it !== element);
  }
};
