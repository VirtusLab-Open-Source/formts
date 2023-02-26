import { FieldMatcher } from "./field-matcher";

describe("FieldMatcher", () => {
  describe(".matches", () => {
    [
      {
        thisField: "foo",
        otherField: "bar",
        result: false,
      },
      {
        thisField: "foo.bar",
        otherField: "foo.baz",
        result: false,
      },
      {
        thisField: "foo.bar[2]",
        otherField: "foo.bar",
        result: false,
      },
      {
        thisField: "foo.bar[2]",
        otherField: "foo.bar[2]",
        result: true,
      },
      {
        thisField: "foo.bar[42]",
        otherField: "foo.bar[*]",
        result: true,
      },
      {
        thisField: "foo.bar[42].baz",
        otherField: "foo.bar[*]",
        result: false,
      },
      {
        thisField: "foo.bar[42]",
        otherField: "foo.bar[*].baz",
        result: false,
      },
      {
        thisField: "foo[1].bar",
        otherField: "foo[*].bar",
        result: true,
      },
      {
        thisField: "foo[1].bar[1]",
        otherField: "foo[*].bar[*]",
        result: true,
      },
      {
        thisField: "foo[1].bar[2]",
        otherField: "foo[*].bar[1]",
        result: false,
      },
      {
        thisField: "foo[1][1][1]",
        otherField: "foo[1][1][2]",
        result: false,
      },
      {
        thisField: "foo[1][1][1]",
        otherField: "foo[1][1][*]",
        result: true,
      },
    ].forEach(({ thisField, otherField, result }) => {
      it(`'${thisField}' matches '${otherField}' -> ${result}`, () => {
        expect(new FieldMatcher(thisField).matches(otherField)).toBe(result);
      });
    });
  });

  describe(".isChildOf", () => {
    [
      {
        thisField: "foo",
        otherField: "foo",
        result: false,
      },
      {
        thisField: "foo",
        otherField: "bar",
        result: false,
      },
      {
        thisField: "foo.bar",
        otherField: "foo",
        result: true,
      },
      {
        thisField: "foo",
        otherField: "foo.bar",
        result: false,
      },
      {
        thisField: "foobar",
        otherField: "foo",
        result: false,
      },
      {
        thisField: "foo",
        otherField: "foobar",
        result: false,
      },
      {
        thisField: "foo[1]",
        otherField: "foo",
        result: true,
      },
      {
        thisField: "foo[1]",
        otherField: "foo[*]",
        result: false,
      },
      {
        thisField: "foo[1].bar",
        otherField: "foo",
        result: true,
      },
      {
        thisField: "foo[1].bar",
        otherField: "foo[1]",
        result: true,
      },
      {
        thisField: "foo[1].bar",
        otherField: "foo[*]",
        result: true,
      },
      {
        thisField: "foo[1].bar",
        otherField: "foo[*].bar",
        result: false,
      },
      {
        thisField: "foo[1][2][3]",
        otherField: "foo[1][2]",
        result: true,
      },
      {
        thisField: "foo[1][2][3]",
        otherField: "foo[*][2]",
        result: true,
      },
      {
        thisField: "foo[1][3][3]",
        otherField: "foo[*][2]",
        result: false,
      },
      {
        thisField: "foo[1][2]",
        otherField: "foo[1][2][3]",
        result: false,
      },
    ].forEach(({ thisField, otherField, result }) => {
      it(`'${thisField}' isChildOf '${otherField}' -> ${result}`, () => {
        expect(new FieldMatcher(thisField).isChildOf(otherField)).toBe(result);
      });
    });
  });

  describe(".isParentOf", () => {
    [
      {
        thisField: "foo",
        otherField: "foo",
        result: false,
      },
      {
        thisField: "foo",
        otherField: "bar",
        result: false,
      },
      {
        thisField: "foo",
        otherField: "foo.bar",
        result: true,
      },
      {
        thisField: "foo.bar",
        otherField: "foo",
        result: false,
      },
      {
        thisField: "foobar",
        otherField: "foo",
        result: false,
      },
      {
        thisField: "foo",
        otherField: "foobar",
        result: false,
      },
      {
        thisField: "foo",
        otherField: "foo[1]",
        result: true,
      },
      {
        thisField: "foo",
        otherField: "foo[*]",
        result: true,
      },
      {
        thisField: "foo[1]",
        otherField: "foo[*]",
        result: false,
      },
      {
        thisField: "foo",
        otherField: "foo[1].bar",
        result: true,
      },
      {
        thisField: "foo[1]",
        otherField: "foo[1].bar",
        result: true,
      },
      {
        thisField: "foo[1]",
        otherField: "foo[*].bar",
        result: true,
      },
      {
        thisField: "foo[1].bar",
        otherField: "foo[1].bar",
        result: false,
      },
      {
        thisField: "foo[1][2]",
        otherField: "foo[1][2][3]",
        result: true,
      },
      {
        thisField: "foo[1][2]",
        otherField: "foo[1][*][3]",
        result: true,
      },
      {
        thisField: "foo[2][1]",
        otherField: "foo[1][*][3]",
        result: false,
      },
      {
        thisField: "foo[1][2][3]",
        otherField: "foo[1][2]",
        result: false,
      },
    ].forEach(({ thisField, otherField, result }) => {
      it(`'${thisField}' isParentOf '${otherField}' -> ${result}`, () => {
        expect(new FieldMatcher(thisField).isParentOf(otherField)).toBe(result);
      });
    });
  });
});
