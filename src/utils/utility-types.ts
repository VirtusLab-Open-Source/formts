class Tagged<T> {
  // @ts-ignore
  private __tag!: T;
}
export type Nominal<Tag, T> = Tagged<Tag> & T;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
export type IsStringUnion<T> = [T] extends [string] ? IsUnion<T> : false;

export type Constructor<T> = new (...args: any[]) => T;

export type ArrayElement<Arr> = Arr extends Array<infer E> ? E : never;
