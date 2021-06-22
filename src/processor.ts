import { Operation, Output } from "./operations";

import { BatchPutOperation, DeleteOperation, GetOperation, PutOperation, UpdateOperation } from "./operations";

export class Processor {
  public operations: Operation<any>[] = [
    new BatchPutOperation(),
    new DeleteOperation(),
    new GetOperation(),
    new PutOperation(),
    new UpdateOperation()
  ];

  public async process(input: {
    operation: string;
    [key: string]: unknown;
  }): Promise<void | Output> {
    console.log(this.operations);
    for (const operation of this.operations) {
      if (operation.name === input.operation) {
        const validated = await operation.validate(input);
        return operation.execute(validated);
      }
    }

    throw new Error("Unknown operation");
  }
}
