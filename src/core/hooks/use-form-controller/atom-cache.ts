import { deepEqual } from "../../../utils";
import { Atom } from "../../../utils/atoms";
import * as Helpers from "../../helpers";
import { FieldDescriptor } from "../../types/field-descriptor";
import { FormtsAtomState, TouchedValues } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";

type FieldPath = string;

export type FieldStateAtom<T> = Atom.Readonly<{
  value: T;
  changed: boolean;
  touched: TouchedValues<T>;
  formSubmitted: boolean;
}>;

export class FieldStateAtomCache<Values extends object, Err> {
  private readonly cache: Record<
    FieldPath,
    FieldStateAtom<unknown> | undefined
  >;

  private readonly formtsState: FormtsAtomState<Values, Err>;

  constructor(formtsState: FormtsAtomState<Values, Err>) {
    this.cache = {};
    this.formtsState = formtsState;
  }

  /**
   * creates new FieldStateAtom or returns existing instance
   */
  get<T>(field: FieldDescriptor<T, Err>): FieldStateAtom<T> {
    return getCachedOrCreate({
      cache: this.cache,
      factory: () =>
        this.createFieldStateAtom(field) as FieldStateAtom<unknown>,
      key: impl(field).__path,
    }) as FieldStateAtom<T>;
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

export type FieldDependenciesAtom = Atom.Readonly<{}>;

export class FieldDependenciesAtomCache<Values extends object, Err> {
  private readonly cache: Record<FieldPath, FieldDependenciesAtom | undefined>;

  private readonly formtsState: FormtsAtomState<Values, Err>;

  constructor(formtsState: FormtsAtomState<Values, Err>) {
    this.cache = {};
    this.formtsState = formtsState;
  }

  /**
   * creates new FieldDependenciesAtom or returns existing instance
   */
  get<T>(field: FieldDescriptor<T, Err>): FieldDependenciesAtom {
    return getCachedOrCreate({
      cache: this.cache,
      factory: () => this.createDependenciesStateAtom(field),
      key: impl(field).__path,
    });
  }

  private createDependenciesStateAtom<T>(
    field: FieldDescriptor<T, Err>
  ): FieldDependenciesAtom {
    return Atom.fuse(
      (_branchErrors, _branchValidating) => {
        return {};
      },
      Atom.fuse(
        x => Helpers.constructBranchErrorsString(x, field),
        this.formtsState.errors
      ),
      Atom.fuse(
        x => Helpers.constructBranchValidatingString(x, field),
        this.formtsState.validating
      )
    );
  }
}

const getCachedOrCreate = <T>(input: {
  cache: Record<string, T | undefined>;
  factory: () => T;
  key: string;
}): T => {
  const { cache, factory, key } = input;

  if (cache[key] !== undefined) {
    return cache[key]!;
  }

  const val = factory();
  cache[key] = val;
  return val;
};
