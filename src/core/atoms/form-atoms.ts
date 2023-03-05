import { FormSchema } from "../types/form-schema";
import { FormtsAtomState } from "../types/formts-state";

import { FieldDependenciesAtomCache } from "./field-deps-atoms";
import { FieldStateAtomCache } from "./field-state-atoms";
import { createFormErrorsAtom } from "./form-errors-atom";
import { createFormHandleAtom } from "./form-handle-atom";

export class FormAtoms<Values extends object, Err> {
  constructor(
    private readonly state: FormtsAtomState<Values, Err>,
    private readonly Schema: FormSchema<Values, Err>
  ) {}

  public readonly formHandle = createFormHandleAtom(this.state, this.Schema);

  public readonly formErrors = createFormErrorsAtom(this.state);

  public readonly fieldStates = new FieldStateAtomCache(this.state);

  public readonly fieldDependencies = new FieldDependenciesAtomCache(
    this.state
  );
}
