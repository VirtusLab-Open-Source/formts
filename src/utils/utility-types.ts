export class Nominal<Tag, P1 = void, P2 = void, P3 = void> {
  // @ts-ignore
  private __tag!: Tag;

  // @ts-ignore
  private __p1!: P1;

  // @ts-ignore
  private __p2!: P2;

  // @ts-ignore
  private __p2!: P3;
}

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
export type IsStringUnion<T> = [T] extends [string] ? IsUnion<T> : false;

export type Constructor<T> = new (...args: any[]) => T;

export type ArrayElement<Arr> = Arr extends Array<infer E> ? E : never;

// prettier-ignore
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T | undefined;

export type IdentityDict<T extends string> = IsUnion<T> extends true
  ? { [K in T]: K }
  : never;

export type Falsy = null | undefined | false;

export const isFalsy = (x: unknown): x is Falsy => {
  return x === null || x === undefined || x === false;
};

export type Primitive = string | number | boolean;

export type WidenType<T> = [T] extends [string]
  ? string
  : [T] extends [number]
  ? number
  : [T] extends [boolean]
  ? boolean
  : T;

export type NoInfer<A> = [A][A extends any ? 0 : never];
