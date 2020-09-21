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

export type Constructor<T> = new (...args: any[]) => T;
