class Tagged<T> {
  private __tag!: T;
}
export type Nominal<Tag, T> = Tagged<Tag> & T;
