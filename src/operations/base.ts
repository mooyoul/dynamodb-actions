export interface Operation<Input> {
  readonly name: string;
  validate(input: unknown): Promise<Input>;
  execute(input: Input): Promise<void | Output>;
}

export interface Output {
  [key: string]: string;
}
