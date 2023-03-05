import { deepEqual } from "../../utils";
import { Atom } from "../../utils/atoms";
import { FieldDescriptor } from "../types/field-descriptor";
import { FormtsAtomState, TouchedValues } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

type FieldPath = string;

export type FieldStateAtom<T> = Atom.Readonly<{
  value: T;
  changed: boolean;
  touched: TouchedValues<T>;
  formSubmitted: boolean;
}>;

export class FieldStateAtomCache<Values extends object, Err> {
  private readonly cache: Partial<
    Record<FieldPath, FieldStateAtom<unknown>>
  > = {};

  constructor(private readonly formtsState: FormtsAtomState<Values, Err>) {}

  /**
   * creates new FieldStateAtom or returns existing instance
   */
  get<T>(field: FieldDescriptor<T, Err>): FieldStateAtom<T> {
    const key = impl(field).__path;
    if (this.cache[key] == null) {
      const atom = this.createFieldStateAtom(field);
      this.cache[key] = atom as FieldStateAtom<unknown>;
    }

    return this.cache[key] as FieldStateAtom<T>;
  }

  private createFieldStateAtom<T>(
    field: FieldDescriptor<T, Err>
  ): FieldStateAtom<T> {
    const lens = impl(field).__lens;
    const fieldValueAtom = Atom.entangle(this.formtsState.values, lens);

    return Atom.fuse(
      (value, changed, touched, formSubmitted) => ({
        value,
        changed,
        touched: touched as any,
        formSubmitted,
      }),
      fieldValueAtom,
      Atom.fuse(
        (initialValue, value) => !deepEqual(value, initialValue),
        Atom.entangle(this.formtsState.initialValues, lens),
        fieldValueAtom
      ),
      Atom.entangle(this.formtsState.touched, lens),
      Atom.fuse(
        (sc, fc) => sc + fc > 0,
        this.formtsState.successfulSubmitCount,
        this.formtsState.failedSubmitCount
      )
    );
  }
}
