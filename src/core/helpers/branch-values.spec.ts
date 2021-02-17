import { FieldDescriptor } from "../types/field-descriptor";

import {
  constructBranchErrorsString,
  constructBranchValidatingString,
} from "./branch-values";

const mockField = (path: string): FieldDescriptor<unknown, unknown> =>
  ({ __path: path } as any);

describe("constructBranchErrorsString", () => {
  it("produces 2 different strings when field error changes", () => {
    const before = constructBranchErrorsString(
      { field: "ERR 1" },
      mockField("field")
    );

    const after = constructBranchErrorsString(
      { field: "ERR 2" },
      mockField("field")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 different strings when nested field error changes", () => {
    const before = constructBranchErrorsString(
      { "field.nested[0]": "ERR 1" },
      mockField("field.nested[0]")
    );

    const after = constructBranchErrorsString(
      { "field.nested[0]": "ERR 2" },
      mockField("field.nested[0]")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 different strings when object child field error changes", () => {
    const before = constructBranchErrorsString(
      { "field.child": "ERR 1" },
      mockField("field")
    );

    const after = constructBranchErrorsString(
      { "field.child": "ERR 2" },
      mockField("field")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 different strings when array child field error changes", () => {
    const before = constructBranchErrorsString(
      { "field[2]": "ERR 1" },
      mockField("field")
    );

    const after = constructBranchErrorsString(
      { "field[2]": "ERR 2" },
      mockField("field")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 same strings when unrelated field error changes", () => {
    const before = constructBranchErrorsString(
      { field: "ERR 1", field2: "ERR 1" },
      mockField("field")
    );

    const after = constructBranchErrorsString(
      { field: "ERR 1", field2: "ERR 2" },
      mockField("field")
    );

    expect(before).toEqual(after);
  });
});

describe("constructBranchValidatingString", () => {
  it("produces 2 different strings when field validating state changes", () => {
    const before = constructBranchValidatingString(
      { field: {} },
      mockField("field")
    );

    const after = constructBranchValidatingString(
      { field: { "123": true } },
      mockField("field")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 different strings when nested field validating state changes", () => {
    const before = constructBranchValidatingString(
      { "field.nested[0]": {} },
      mockField("field.nested[0]")
    );

    const after = constructBranchValidatingString(
      { "field.nested[0]": { "123": true } },
      mockField("field.nested[0]")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 different strings when object child field validating state changes", () => {
    const before = constructBranchValidatingString(
      { "field.child": {} },
      mockField("field")
    );

    const after = constructBranchValidatingString(
      { "field.child": { "123": true } },
      mockField("field")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 different strings when array child field validating state changes", () => {
    const before = constructBranchValidatingString(
      { "field[2]": {} },
      mockField("field")
    );

    const after = constructBranchValidatingString(
      { "field[2]": { "123": true } },
      mockField("field")
    );

    expect(before).not.toEqual(after);
  });

  it("produces 2 same strings when unrelated field validating state changes", () => {
    const before = constructBranchValidatingString(
      { field: {}, field2: {} },
      mockField("field")
    );

    const after = constructBranchValidatingString(
      { field: {}, field2: { "123": true } },
      mockField("field")
    );

    expect(before).toEqual(after);
  });
});
