import { generateFieldPathsFromTemplate } from "./field-template";

describe("generateFieldPathsFromTemplate", () => {
  it("array[*]", () => {
    const template = "array[*]";
    const getValue = (path: string): any => {
      switch (path) {
        case "array":
          return [1, 2, 3];
      }
    };

    const paths = generateFieldPathsFromTemplate(template, getValue);

    expect(paths).toEqual(["array[0]", "array[1]", "array[2]"]);
  });

  it("array[*].a.b.c", () => {
    const template = "array[*].a.b.c";
    const getValue = (path: string): any => {
      switch (path) {
        case "array":
          return [1, 2, 3];
      }
    };

    const paths = generateFieldPathsFromTemplate(template, getValue);

    expect(paths).toEqual([
      "array[0].a.b.c",
      "array[1].a.b.c",
      "array[2].a.b.c",
    ]);
  });

  it("array[*][*]", () => {
    const template = "array[*][*]";
    const getValue = (path: string): any => {
      switch (path) {
        case "array":
          return [1, 2, 3];
        case "array[0]":
          return [1];
        case "array[1]":
          return [1, 2];
        case "array[2]":
          return [1, 2, 3];
      }
    };

    const paths = generateFieldPathsFromTemplate(template, getValue);

    expect(paths).toEqual([
      "array[0][0]",
      "array[1][0]",
      "array[1][1]",
      "array[2][0]",
      "array[2][1]",
      "array[2][2]",
    ]);
  });

  it("array[*][*] with array=[]", () => {
    const template = "array[*][*]";
    const getValue = (path: string): any => {
      switch (path) {
        case "array":
          return [];
        case "array[0]":
          return [1];
        case "array[1]":
          return [1, 2];
        case "array[2]":
          return [1, 2, 3];
      }
    };

    const paths = generateFieldPathsFromTemplate(template, getValue);

    expect(paths).toEqual([]);
  });

  it("array[*][*] with empty nested arrays", () => {
    const template = "array[*][*]";
    const getValue = (path: string): any => {
      switch (path) {
        case "array":
          return [1, 2, 3];
        case "array[0]":
          return [];
        case "array[1]":
          return [1, 2];
        case "array[2]":
          return [];
      }
    };

    const paths = generateFieldPathsFromTemplate(template, getValue);

    expect(paths).toEqual(["array[1][0]", "array[1][1]"]);
  });

  it("array[*].list[*]", () => {
    const template = "array[*].list[*]";
    const getValue = (path: string): any => {
      switch (path) {
        case "array":
          return [1, 2, 3];
        case "array[0].list":
          return [1];
        case "array[1].list":
          return [1];
        case "array[2].list":
          return [1];
      }
    };

    const paths = generateFieldPathsFromTemplate(template, getValue);

    expect(paths).toEqual([
      "array[0].list[0]",
      "array[1].list[0]",
      "array[2].list[0]",
    ]);
  });
});
