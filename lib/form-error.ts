export type FormResult = { field?: string; message?: string }

export class FieldError extends Error {
  constructor(public field: string, message: string) { super(message) }
}
