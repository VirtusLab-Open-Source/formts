import { range } from "./misc-utils";

describe("range", () => {
  [
    { start: 0, end: 5, result: [0, 1, 2, 3, 4, 5] },
    { start: 5, end: 0, result: [5, 4, 3, 2, 1, 0] },
    { start: -1, end: 1, result: [-1, 0, 1] },
    { start: 0, end: 0, result: [0] },
    { start: 10, end: 10, result: [10] },
    { start: -10, end: -10, result: [-10] },
  ].forEach(({ start, end, result }) =>
    it(`range(${start}, ${end}) == ${result}`, () => {
      expect(range(start, end)).toEqual(result);
    })
  );
});
