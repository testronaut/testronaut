export type Public<T> = {
  [K in keyof T]: T[K];
};
