import * as Decoders from "../decoders";
import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { impl } from "../types/type-mapper-util";

import { decodeChangeEvent } from "./decode-change-event";

namespace MockEvent {
  export const textInput = (value: string) => ({
    target: { type: "text", value },
  });
  export const passwordInput = (value: string) => ({
    target: { type: "password", value },
  });

  export const numberInput = (value: "" | number) => ({
    target: {
      type: "number",
      value: value.toString(),
      valueAsNumber: value,
    },
  });

  export const dateInput = (date: Date) => ({
    target: {
      type: "date",
      value: date.toLocaleDateString("en-CA"),
      valueAsNumber: date.valueOf(),
    },
  });
  export const dateTimeInput = (date: Date) => ({
    target: {
      type: "datetime",
      value: date.toLocaleString("en-CA"),
      valueAsNumber: date.valueOf(),
    },
  });
  export const dateTimeLocalInput = (date: Date) => ({
    target: {
      type: "datetime-local",
      value: date.toLocaleString("en-CA"),
      valueAsNumber: date.valueOf(),
    },
  });
  export const monthInput = (date: Date) => ({
    target: {
      type: "month",
      value: date.toLocaleDateString("en-CA"),
      valueAsNumber: date.valueOf(),
    },
  });
  export const timeInput = (date: Date) => ({
    target: {
      type: "time",
      value: date.toLocaleTimeString("en-CA"),
      valueAsNumber: date.valueOf(),
    },
  });

  export const checkboxInput = (checked: boolean, value?: string) => ({
    target: { type: "checkbox", value, checked },
  });
  export const radioInput = (checked: boolean, value?: string) => ({
    target: { type: "radio", value, checked },
  });

  export const select = (value: string) => ({
    target: { type: "select-one", value },
  });
  export const multiSelect = (
    options: Array<{ value: string; selected: boolean }>
  ) => ({
    target: { type: "select-multiple", options },
  });

  export const custom = <T>(value: T) => ({
    target: { value },
  });
}

namespace Result {
  export const success = <T>(value: T) => ({ ok: true as const, value });
  export const failure = () => ({ ok: false as const });
}

describe("decodeChangeEvent", () => {
  const getEventDecoder = <T>(fieldDecoder: FieldDecoder<T>, value: T) => (
    event: any
  ) =>
    decodeChangeEvent({
      fieldDecoder: impl(fieldDecoder),
      getValue: () => value,
      event,
    });

  describe("from text-like inputs", () => {
    it("decodes matching events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");

      expect(decode(MockEvent.textInput(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.textInput("foo"))).toEqual(Result.success("foo"));
      expect(decode(MockEvent.textInput("42"))).toEqual(Result.success("42"));
      expect(decode(MockEvent.passwordInput("bar"))).toEqual(
        Result.success("bar")
      );
    });

    it("decodes matching events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);

      expect(decode(MockEvent.textInput("foo"))).toEqual(Result.failure());

      expect(decode(MockEvent.textInput(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.textInput("42"))).toEqual(Result.success(42));
      expect(decode(MockEvent.textInput("10e-3"))).toEqual(
        Result.success(0.01)
      );
    });

    it("decodes matching events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("A", "BB"), "A");

      expect(decode(MockEvent.textInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("a"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("B"))).toEqual(Result.failure());

      expect(decode(MockEvent.textInput("A"))).toEqual(Result.success("A"));
      expect(decode(MockEvent.textInput("BB"))).toEqual(Result.success("BB"));
    });

    it("decodes matching events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), true);

      expect(decode(MockEvent.textInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("0"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("1"))).toEqual(Result.failure());

      expect(decode(MockEvent.textInput("true"))).toEqual(Result.success(true));
      expect(decode(MockEvent.textInput("false"))).toEqual(
        Result.success(false)
      );
      expect(decode(MockEvent.textInput("TRUE"))).toEqual(Result.success(true));
      expect(decode(MockEvent.textInput("FALSE"))).toEqual(
        Result.success(false)
      );
      expect(decode(MockEvent.textInput("True"))).toEqual(Result.success(true));
      expect(decode(MockEvent.textInput("False"))).toEqual(
        Result.success(false)
      );
    });

    it("fails decoding events for array field", () => {
      const decode = getEventDecoder(Decoders.array(Decoders.string()), []);

      expect(decode(MockEvent.textInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("a,b,c"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("[a,b,c]"))).toEqual(Result.failure());
    });

    it("fails decoding events for object field", () => {
      const decode = getEventDecoder(
        Decoders.object({ foo: Decoders.string() }),
        { foo: "" }
      );

      expect(decode(MockEvent.textInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput('{ foo: "" }'))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for Date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);

      expect(decode(MockEvent.textInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("12:00"))).toEqual(Result.failure());
      expect(decode(MockEvent.textInput("1609290817207"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.textInput("12:00"))).toEqual(Result.failure());

      expect(decode(MockEvent.textInput("2020-12-24"))).toEqual(
        Result.success(new Date("2020-12-24"))
      );
      expect(decode(MockEvent.textInput("2020-12-24T10:00"))).toEqual(
        Result.success(new Date("2020-12-24T10:00"))
      );
      expect(decode(MockEvent.textInput("2020-12-24T12:00:00.000Z"))).toEqual(
        Result.success(new Date("2020-12-24T12:00:00.000Z"))
      );
    });
  });

  describe("from number inputs", () => {
    it("decodes matching events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");

      expect(decode(MockEvent.numberInput(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.numberInput(42))).toEqual(Result.success("42"));
      expect(decode(MockEvent.numberInput(-0.1))).toEqual(
        Result.success("-0.1")
      );
    });

    it("decodes matching events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);

      expect(decode(MockEvent.numberInput(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.numberInput(42))).toEqual(Result.success(42));
      expect(decode(MockEvent.numberInput(-0.1))).toEqual(Result.success(-0.1));
    });

    it("decodes matching events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("1", "2"), "1");

      expect(decode(MockEvent.numberInput(1))).toEqual(Result.success("1"));
      expect(decode(MockEvent.numberInput(2))).toEqual(Result.success("2"));

      expect(decode(MockEvent.numberInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.numberInput(42))).toEqual(Result.failure());
    });

    it("fails decoding events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), null);

      expect(decode(MockEvent.numberInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.numberInput(0))).toEqual(Result.failure());
      expect(decode(MockEvent.numberInput(1))).toEqual(Result.failure());
      expect(decode(MockEvent.numberInput(1609290817207))).toEqual(
        Result.failure()
      );
    });

    it("fails decoding events for array field", () => {
      const decode = getEventDecoder(Decoders.array(Decoders.number()), []);

      expect(decode(MockEvent.numberInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.numberInput(42))).toEqual(Result.failure());
    });

    it("fails decoding events for object field", () => {
      const decode = getEventDecoder(
        Decoders.object({ foo: Decoders.number() }),
        { foo: 1 }
      );

      expect(decode(MockEvent.numberInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.numberInput(42))).toEqual(Result.failure());
    });

    it("fails decoding events for Date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);

      expect(decode(MockEvent.numberInput(""))).toEqual(Result.failure());
      expect(decode(MockEvent.numberInput(1609290817207))).toEqual(
        Result.failure()
      );
    });
  });

  describe("from date-like inputs", () => {
    it("decodes matching events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");
      const someDate = new Date();

      {
        const event = MockEvent.dateInput(someDate);
        expect(decode(event)).toEqual(Result.success(event.target.value));
      }
      {
        const event = MockEvent.dateTimeInput(someDate);
        expect(decode(event)).toEqual(Result.success(event.target.value));
      }
      {
        const event = MockEvent.dateTimeLocalInput(someDate);
        expect(decode(event)).toEqual(Result.success(event.target.value));
      }
      {
        const event = MockEvent.monthInput(someDate);
        expect(decode(event)).toEqual(Result.success(event.target.value));
      }
      {
        const event = MockEvent.timeInput(someDate);
        expect(decode(event)).toEqual(Result.success(event.target.value));
      }
    });

    it("decodes matching events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);
      const someDate = new Date();

      expect(decode(MockEvent.dateInput(someDate))).toEqual(
        Result.success(someDate.valueOf())
      );
      expect(decode(MockEvent.dateTimeInput(someDate))).toEqual(
        Result.success(someDate.valueOf())
      );
      expect(decode(MockEvent.dateTimeLocalInput(someDate))).toEqual(
        Result.success(someDate.valueOf())
      );
      expect(decode(MockEvent.monthInput(someDate))).toEqual(
        Result.success(someDate.valueOf())
      );
      expect(decode(MockEvent.timeInput(someDate))).toEqual(
        Result.success(someDate.valueOf())
      );
    });

    it("fails decoding events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("A", "B"), "A");

      const event = MockEvent.dateInput(new Date());
      expect(decode(event)).toEqual(Result.failure());
    });

    it("fails decoding events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), false);

      const event = MockEvent.dateInput(new Date());
      expect(decode(event)).toEqual(Result.failure());
    });

    it("fails decoding events for array field", () => {
      const decode = getEventDecoder(Decoders.array(Decoders.string()), []);

      const event = MockEvent.dateInput(new Date());
      expect(decode(event)).toEqual(Result.failure());
    });

    it("fails decoding events for object field", () => {
      const decode = getEventDecoder(
        Decoders.object({ foo: Decoders.string() }),
        { foo: "" }
      );

      const event = MockEvent.dateInput(new Date());
      expect(decode(event)).toEqual(Result.failure());
    });

    it("decodes matching events for Date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);
      const someDate = new Date();

      expect(decode(MockEvent.dateInput(someDate))).toEqual(
        Result.success(someDate)
      );
      expect(decode(MockEvent.dateTimeInput(someDate))).toEqual(
        Result.success(someDate)
      );
      expect(decode(MockEvent.dateTimeLocalInput(someDate))).toEqual(
        Result.success(someDate)
      );
      expect(decode(MockEvent.monthInput(someDate))).toEqual(
        Result.success(someDate)
      );
      expect(decode(MockEvent.timeInput(someDate))).toEqual(
        Result.success(someDate)
      );
    });
  });

  describe("from checkbox inputs", () => {
    it("fails decoding events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");

      expect(decode(MockEvent.checkboxInput(true, "foo"))).toEqual(
        Result.failure()
      );
    });

    it("fails decoding events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);

      expect(decode(MockEvent.checkboxInput(true, "42"))).toEqual(
        Result.failure()
      );
    });

    it("fails decoding events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("A", "B"), "A");

      expect(decode(MockEvent.checkboxInput(true, "A"))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), false);

      expect(decode(MockEvent.checkboxInput(true, "foo"))).toEqual(
        Result.success(true)
      );
      expect(decode(MockEvent.checkboxInput(false, "foo"))).toEqual(
        Result.success(false)
      );
    });

    it("decodes matching events for array field", () => {
      const decode = getEventDecoder(
        Decoders.array(Decoders.choice("A", "B", "C")),
        ["A", "B"]
      );

      expect(decode(MockEvent.checkboxInput(false, "A"))).toEqual(
        Result.success(["B"])
      );
      expect(decode(MockEvent.checkboxInput(true, "C"))).toEqual(
        Result.success(["A", "B", "C"])
      );
      expect(decode(MockEvent.checkboxInput(true, "D"))).toEqual(
        Result.failure()
      );
    });

    it("fails decoding events for object field", () => {
      const decode = getEventDecoder(Decoders.object({ A: Decoders.bool() }), {
        A: false,
      });

      expect(decode(MockEvent.checkboxInput(true, "A"))).toEqual(
        Result.failure()
      );
    });

    it("fails decoding events for Date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);

      expect(decode(MockEvent.checkboxInput(true, "foo"))).toEqual(
        Result.failure()
      );
    });
  });

  describe("from radio inputs", () => {
    it("decodes matching events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");

      expect(decode(MockEvent.radioInput(true, ""))).toEqual(
        Result.success("")
      );
      expect(decode(MockEvent.radioInput(false, ""))).toEqual(Result.failure());
      expect(decode(MockEvent.radioInput(true, "foo"))).toEqual(
        Result.success("foo")
      );
      expect(decode(MockEvent.radioInput(false, "foo"))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);

      expect(decode(MockEvent.radioInput(true, ""))).toEqual(
        Result.success("")
      );
      expect(decode(MockEvent.radioInput(false, ""))).toEqual(Result.failure());
      expect(decode(MockEvent.radioInput(true, "foo"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(false, "foo"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(true, "42"))).toEqual(
        Result.success(42)
      );
      expect(decode(MockEvent.radioInput(false, "42"))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("A", "B"), "A");

      expect(decode(MockEvent.radioInput(true, ""))).toEqual(Result.failure());
      expect(decode(MockEvent.radioInput(false, ""))).toEqual(Result.failure());
      expect(decode(MockEvent.radioInput(true, "A"))).toEqual(
        Result.success("A")
      );
      expect(decode(MockEvent.radioInput(false, "A"))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), false);

      expect(decode(MockEvent.radioInput(true, ""))).toEqual(Result.failure());
      expect(decode(MockEvent.radioInput(false, ""))).toEqual(Result.failure());
      expect(decode(MockEvent.radioInput(true, "true"))).toEqual(
        Result.success(true)
      );
      expect(decode(MockEvent.radioInput(false, "true"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(true, "false"))).toEqual(
        Result.success(false)
      );
      expect(decode(MockEvent.radioInput(false, "false"))).toEqual(
        Result.failure()
      );
    });

    it("fails decoding events for array field", () => {
      const decode = getEventDecoder(Decoders.array(Decoders.string()), []);

      expect(decode(MockEvent.radioInput(true, "foo"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(false, "foo"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(true, '["foo"]'))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(false, '["foo"]'))).toEqual(
        Result.failure()
      );
    });

    it("fails decoding events for object field", () => {
      const decode = getEventDecoder(
        Decoders.object({ foo: Decoders.string() }),
        { foo: "" }
      );

      expect(decode(MockEvent.radioInput(true, "foo"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(false, "foo"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(true, '{ foo: "" }'))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(false, '{ foo: "" }'))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for Date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);
      const someDate = new Date();

      expect(decode(MockEvent.radioInput(true, "foo"))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.radioInput(false, "foo"))).toEqual(
        Result.failure()
      );
      expect(
        decode(MockEvent.radioInput(true, someDate.toISOString()))
      ).toEqual(Result.success(someDate));
      expect(
        decode(MockEvent.radioInput(false, someDate.toISOString()))
      ).toEqual(Result.failure());
    });
  });

  describe("from single-select inputs", () => {
    it("decodes matching events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");

      expect(decode(MockEvent.select(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.select("foo"))).toEqual(Result.success("foo"));
    });

    it("decodes matching events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);

      expect(decode(MockEvent.select(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.select("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.select("42"))).toEqual(Result.success(42));
    });

    it("decodes matching events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("A", "B"), "A");

      expect(decode(MockEvent.select(""))).toEqual(Result.failure());
      expect(decode(MockEvent.select("A"))).toEqual(Result.success("A"));
      expect(decode(MockEvent.select("B"))).toEqual(Result.success("B"));
      expect(decode(MockEvent.select("C"))).toEqual(Result.failure());
    });

    it("decodes matching events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), false);

      expect(decode(MockEvent.select(""))).toEqual(Result.failure());
      expect(decode(MockEvent.select("true"))).toEqual(Result.success(true));
      expect(decode(MockEvent.select("false"))).toEqual(Result.success(false));
    });

    it("fails decoding events for array field", () => {
      const decode = getEventDecoder(Decoders.array(Decoders.string()), []);

      expect(decode(MockEvent.select("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.select('["foo"]'))).toEqual(Result.failure());
    });

    it("fails decoding events for object field", () => {
      const decode = getEventDecoder(
        Decoders.object({ foo: Decoders.string() }),
        { foo: "" }
      );

      expect(decode(MockEvent.select("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.select('{ foo: "" }'))).toEqual(Result.failure());
    });

    it("decodes matching events for Date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);
      const someDate = new Date();

      expect(decode(MockEvent.select("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.select(someDate.toISOString()))).toEqual(
        Result.success(someDate)
      );
    });
  });

  describe("from multi-select inputs", () => {
    it("fails decoding events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");

      expect(
        decode(MockEvent.multiSelect([{ selected: true, value: "foo" }]))
      ).toEqual(Result.failure());
    });

    it("fails decoding events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);

      expect(
        decode(MockEvent.multiSelect([{ selected: true, value: "42" }]))
      ).toEqual(Result.failure());
    });

    it("fails decoding events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("A", "B"), "A");

      expect(
        decode(MockEvent.multiSelect([{ selected: true, value: "A" }]))
      ).toEqual(Result.failure());
    });

    it("fails decoding events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), false);

      expect(
        decode(MockEvent.multiSelect([{ selected: true, value: "true" }]))
      ).toEqual(Result.failure());
    });

    it("decodes matching events for array field", () => {
      const decode = getEventDecoder(
        Decoders.array(Decoders.choice("A", "B", "C")),
        []
      );

      expect(
        decode(
          MockEvent.multiSelect([
            { selected: false, value: "A" },
            { selected: false, value: "B" },
          ])
        )
      ).toEqual(Result.success([]));

      expect(
        decode(
          MockEvent.multiSelect([
            { selected: true, value: "A" },
            { selected: false, value: "B" },
          ])
        )
      ).toEqual(Result.success(["A"]));

      expect(
        decode(
          MockEvent.multiSelect([
            { selected: true, value: "A" },
            { selected: false, value: "B" },
            { selected: true, value: "D" },
          ])
        )
      ).toEqual(Result.failure());
    });

    it("fails decoding events for object field", () => {
      const decode = getEventDecoder(
        Decoders.object({ foo: Decoders.bool() }),
        { foo: false }
      );

      expect(
        decode(MockEvent.multiSelect([{ selected: true, value: "foo" }]))
      ).toEqual(Result.failure());
    });

    it("fails decoding events for Date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);

      expect(
        decode(
          MockEvent.multiSelect([
            { selected: true, value: new Date().toISOString() },
          ])
        )
      ).toEqual(Result.failure());
    });
  });

  describe("from artificial source", () => {
    it("decodes matching events for string field", () => {
      const decode = getEventDecoder(Decoders.string(), "");
      const someDate = new Date();

      expect(decode(MockEvent.custom(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.custom("foo"))).toEqual(Result.success("foo"));
      expect(decode(MockEvent.custom("42"))).toEqual(Result.success("42"));
      expect(decode(MockEvent.custom(42))).toEqual(Result.success("42"));
      expect(decode(MockEvent.custom(someDate))).toEqual(
        Result.success(someDate.toISOString())
      );
      expect(decode(MockEvent.custom(true))).toEqual(Result.success("true"));
      expect(decode(MockEvent.custom(false))).toEqual(Result.success("false"));

      expect(decode(MockEvent.custom({ foo: "bar" }))).toEqual(
        Result.failure()
      );
      expect(decode(MockEvent.custom(["a", "b"]))).toEqual(Result.failure());
      expect(decode(MockEvent.custom(undefined))).toEqual(Result.failure());
    });

    it("decodes matching events for number field", () => {
      const decode = getEventDecoder(Decoders.number(), 0);
      const someDate = new Date();

      expect(decode(MockEvent.custom(""))).toEqual(Result.success(""));
      expect(decode(MockEvent.custom("foo"))).toEqual(Result.failure());
      expect(decode(MockEvent.custom("42"))).toEqual(Result.success(42));
      expect(decode(MockEvent.custom("10e-3"))).toEqual(Result.success(0.01));
      expect(decode(MockEvent.custom(someDate))).toEqual(
        Result.success(someDate.valueOf())
      );
      expect(decode(MockEvent.custom(true))).toEqual(Result.failure());
      expect(decode(MockEvent.custom([1, 2]))).toEqual(Result.failure());
      expect(decode(MockEvent.custom({ 1: 2 }))).toEqual(Result.failure());
      expect(decode(MockEvent.custom(undefined))).toEqual(Result.failure());
    });

    it("decodes matching events for choice field", () => {
      const decode = getEventDecoder(Decoders.choice("AA", "10"), "AA");

      expect(decode(MockEvent.custom(""))).toEqual(Result.failure());
      expect(decode(MockEvent.custom("A"))).toEqual(Result.failure());
      expect(decode(MockEvent.custom("AA"))).toEqual(Result.success("AA"));
      expect(decode(MockEvent.custom("AAA"))).toEqual(Result.failure());
      expect(decode(MockEvent.custom(1))).toEqual(Result.failure());
      expect(decode(MockEvent.custom(10))).toEqual(Result.success("10"));
    });

    it("decodes matching events for bool field", () => {
      const decode = getEventDecoder(Decoders.bool(), false);

      expect(decode(MockEvent.custom(""))).toEqual(Result.failure());
      expect(decode(MockEvent.custom("true"))).toEqual(Result.success(true));
      expect(decode(MockEvent.custom("false"))).toEqual(Result.success(false));
      expect(decode(MockEvent.custom("True"))).toEqual(Result.success(true));
      expect(decode(MockEvent.custom("False"))).toEqual(Result.success(false));
      expect(decode(MockEvent.custom(true))).toEqual(Result.success(true));
      expect(decode(MockEvent.custom(false))).toEqual(Result.success(false));
      expect(decode(MockEvent.custom(1))).toEqual(Result.failure());
      expect(decode(MockEvent.custom(0))).toEqual(Result.failure());
    });

    it("decodes matching events for object field", () => {
      const decode = getEventDecoder(
        Decoders.object({ foo: Decoders.object({ bar: Decoders.number() }) }),
        { foo: { bar: 0 } }
      );

      expect(decode(MockEvent.custom({ foo: { bar: 42 } }))).toEqual(
        Result.success({ foo: { bar: 42 } })
      );
      expect(
        decode(MockEvent.custom({ foo: { bar: 42 }, foo2: "bar2" }))
      ).toEqual(Result.success({ foo: { bar: 42 } }));
      expect(decode(MockEvent.custom({ foo: { bar: "42" } }))).toEqual(
        Result.success({ foo: { bar: 42 } })
      );
      expect(
        decode(MockEvent.custom(JSON.stringify({ foo: { bar: 42 } })))
      ).toEqual(Result.failure());
      expect(decode(MockEvent.custom({ foo: { bar: undefined } }))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for array field", () => {
      const decode = getEventDecoder(Decoders.array(Decoders.number()), []);

      expect(decode(MockEvent.custom([]))).toEqual(Result.success([]));
      expect(decode(MockEvent.custom([1, 2, 3]))).toEqual(
        Result.success([1, 2, 3])
      );
      expect(decode(MockEvent.custom(["1", "2", "3"]))).toEqual(
        Result.success([1, 2, 3])
      );
      expect(decode(MockEvent.custom([1, 2, "3"]))).toEqual(
        Result.success([1, 2, 3])
      );
      expect(decode(MockEvent.custom([1, 2, "c"]))).toEqual(Result.failure());
      expect(decode(MockEvent.custom(JSON.stringify([1, 2, 3])))).toEqual(
        Result.failure()
      );
    });

    it("decodes matching events for date field", () => {
      const decode = getEventDecoder(Decoders.date(), null);
      const validDate = new Date();
      const invalidDate = new Date("foobar");

      expect(decode(MockEvent.custom(validDate))).toEqual(
        Result.success(validDate)
      );
      expect(decode(MockEvent.custom(validDate.toISOString()))).toEqual(
        Result.success(new Date(validDate.toISOString()))
      );
      expect(decode(MockEvent.custom(validDate.toString()))).toEqual(
        Result.success(new Date(validDate.toString()))
      );
      expect(decode(MockEvent.custom(validDate.valueOf()))).toEqual(
        Result.success(validDate)
      );

      expect(decode(MockEvent.custom(invalidDate))).toEqual(Result.failure());
      expect(
        decode(MockEvent.custom(validDate.toISOString() + "foobar"))
      ).toEqual(Result.failure());
      expect(decode(MockEvent.custom(invalidDate.valueOf()))).toEqual(
        Result.failure()
      );
    });
  });

  it("fails decoding when event.target is missing", () => {
    const decode = getEventDecoder(Decoders.string(), "");

    expect(decode({})).toEqual(Result.failure());
  });
});
