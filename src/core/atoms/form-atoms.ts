import { FormSchema } from "../types/form-schema";
import { FormtsAtomState } from "../types/formts-state";

import { FieldDependenciesAtomCache } from "./field-deps-atoms";
import { FieldStateAtomCache } from "./field-state-atoms";
import { FormErrorsAtom, createFormErrorsAtom } from "./form-errors-atom";
import { FormHandleAtom, createFormHandleAtom } from "./form-handle-atom";

export class FormAtoms<Values extends object, Err> {
  public readonly formHandle: FormHandleAtom;
  public readonly formErrors: FormErrorsAtom<Err>;
  public readonly fieldStates: FieldStateAtomCache<Values, Err>;
  public readonly fieldDependencies: FieldDependenciesAtomCache<Values, Err>;

  constructor(
    private readonly state: FormtsAtomState<Values, Err>,
    private readonly Schema: FormSchema<Values, Err>
  ) {
    this.formHandle = createFormHandleAtom(this.state, this.Schema);
    this.formErrors = createFormErrorsAtom(this.state);
    this.fieldStates = new FieldStateAtomCache(this.state);
    this.fieldDependencies = new FieldDependenciesAtomCache(this.state);
  }
}
