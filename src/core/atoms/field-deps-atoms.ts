import { Atom } from "../../utils/atoms";
import * as Helpers from "../helpers";
import { FieldDescriptor } from "../types/field-descriptor";
import { FormtsAtomState } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

type FieldPath = string;

export type FieldDependenciesAtom = Atom.Readonly<{}>;

export class FieldDependenciesAtomCache<Values extends object, Err> {
  private readonly cache: Partial<
    Record<FieldPath, FieldDependenciesAtom>
  > = {};

  constructor(private readonly formtsState: FormtsAtomState<Values, Err>) {}

  /**
   * creates new FieldDependenciesAtom or returns existing instance
   */
  get<T>(field: FieldDescriptor<T, Err>): FieldDependenciesAtom {
    const key = impl(field).__path;
    if (this.cache[key] == null) {
      this.cache[key] = this.createDependenciesStateAtom(field);
    }

    return this.cache[key]!;
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
