export type Falsy = null | undefined | false;
export type Primitive = string | number | boolean;

export type WidenType<T> = [T] extends [string]
  ? string
  : [T] extends [number]
  ? number
  : [T] extends [boolean]
  ? boolean
  : T;

export type Values<O extends object> = O[keyof O];

// prettier-ignore
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T | undefined;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

export type IdentityDict<T extends string> = IsUnion<T> extends true
  ? { [K in T]: K }
  : never;

export type Constructor<T> = new (...args: any[]) => T;

class Tagged<T> {
  private __tag!: T;
}
export type Nominal<Tag, T> = Tagged<Tag> & T;
