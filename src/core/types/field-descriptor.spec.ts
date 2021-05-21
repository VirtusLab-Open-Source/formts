import { FormFields, FormSchemaBuilder } from "../builders";

import {
  FieldDescriptor,
  getChildrenDescriptors,
  getParentsChain,
} from "./field-descriptor";
import { impl } from "./type-mapper-util";

const Schema = new FormSchemaBuilder()
  .fields({
    theString: FormFields.string(),
    theNumber: FormFields.number(),
    theArray: FormFields.array(FormFields.string()),
    theObject: FormFields.object({
      foo: FormFields.string(),
    }),
    theObjectArray: FormFields.object({
      arr: FormFields.array(FormFields.string()),
    }),
  })
  .errors<string>()
  .build();

describe("getChildrenDescriptors", () => {
  it("should return no children for primitive types", () => {
    const getValue = () => "";

    {
      const children = getChildrenDescriptors(Schema.theString, getValue);
      expect(children.length).toEqual(1);
      expect(impl(children[0]).__path).toEqual("theString");
    }

    {
      const children = getChildrenDescriptors(Schema.theNumber, getValue);
      expect(children.length).toEqual(1);
      expect(impl(children[0]).__path).toEqual("theNumber");
    }
  });

  it("should return no children for empty array", () => {
    const getValue = (field: FieldDescriptor<any>) => {
      const path = impl(field).__path;
      switch (path) {
        case "theArray":
          return [];
        default:
          return null;
      }
    };

    const children = getChildrenDescriptors(Schema.theArray, getValue);

    expect(children.length).toEqual(1);
    expect(impl(children[0]).__path).toEqual("theArray");
  });

  it("should return n children for n-element array", () => {
    const getValue = (field: FieldDescriptor<any>) => {
      const path = impl(field).__path;
      switch (path) {
        case "theArray":
          return ["one", "two", "three"];
        case "theArray[0]":
          return "one";
        case "theArray[1]":
          return "two";
        case "theArray[2]":
          return "three";
        default:
          return null;
      }
    };

    const children = getChildrenDescriptors(Schema.theArray, getValue);

    expect(children.length).toEqual(4);
    expect(impl(children[0]).__path).toEqual("theArray");
    expect(impl(children[1]).__path).toEqual("theArray[0]");
    expect(impl(children[2]).__path).toEqual("theArray[1]");
    expect(impl(children[3]).__path).toEqual("theArray[2]");
  });

  it("should return proper children for object", () => {
    const getValue = (field: FieldDescriptor<any>) => {
      const path = impl(field).__path;
      switch (path) {
        case "theObject":
          return { foo: "foo" };
        case "theObject.foo":
          return "foo";
        default:
          return null;
      }
    };

    const children = getChildrenDescriptors(Schema.theObject, getValue);

    expect(children.length).toEqual(2);
    expect(impl(children[0]).__path).toEqual("theObject");
    expect(impl(children[1]).__path).toEqual("theObject.foo");
  });

  it("should return proper children for object of arrays", () => {
    const getValue = (field: FieldDescriptor<any>) => {
      const path = impl(field).__path;
      switch (path) {
        case "theObjectArray":
          return { arr: [""] };
        case "theObjectArray.arr":
          return [""];
        case "theObjectArray.arr[0]":
          return "";
        default:
          return null;
      }
    };

    const children = getChildrenDescriptors(Schema.theObjectArray, getValue);

    expect(children.length).toEqual(3);
    expect(impl(children[0]).__path).toEqual("theObjectArray");
    expect(impl(children[1]).__path).toEqual("theObjectArray.arr");
    expect(impl(children[2]).__path).toEqual("theObjectArray.arr[0]");
  });

  it("should return proper children for lower level", () => {
    const getValue = (field: FieldDescriptor<any>) => {
      const path = impl(field).__path;
      switch (path) {
        case "theObjectArray":
          return { arr: [""] };
        case "theObjectArray.arr":
          return [""];
        case "theObjectArray.arr[0]":
          return "";
        default:
          return null;
      }
    };

    const children = getChildrenDescriptors(
      Schema.theObjectArray.arr,
      getValue
    );

    expect(children.length).toEqual(2);
    expect(impl(children[0]).__path).toEqual("theObjectArray.arr");
    expect(impl(children[1]).__path).toEqual("theObjectArray.arr[0]");
  });
});

describe("getParentsChain", () => {
  it("should return empty chain for root fields", () => {
    expect(getParentsChain(Schema.theString)).toEqual([]);
  });

  it("should return [theObject] for theObject.foo", () => {
    const parents = getParentsChain(Schema.theObject.foo);

    expect(parents.length).toEqual(1);
    expect(impl(parents[0]).__path).toEqual("theObject");
  });

  it("should return [theObjectArray.arr, theObjectArray] for theObjectArray.arr[2]", () => {
    const parents = getParentsChain(Schema.theObjectArray.arr.nth(2));

    expect(parents.length).toEqual(2);
    expect(impl(parents[0]).__path).toEqual("theObjectArray.arr");
    expect(impl(parents[1]).__path).toEqual("theObjectArray");
  });
});
