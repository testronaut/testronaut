export interface Transform {
  (code: string, id: string): string;
}
