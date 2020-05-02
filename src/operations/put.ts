import * as Joi from "@hapi/joi";
import { createClient } from "../helpers";
import { Operation } from "./base";

const InputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("put").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
  item: Joi.object().required(),
}).required();

export interface PutOperationInput {
  operation: "put";
  region: string;
  table: string;
  item: { [key: string]: any };
}

export class PutOperation implements Operation<PutOperationInput> {
  public readonly name = "put";

  public async validate(input: unknown): Promise<PutOperationInput> {
    const validationResult = InputSchema.validate(input, {
      stripUnknown: true,
    });
    if (validationResult.error) {
      throw validationResult.error;
    }

    return validationResult.value as PutOperationInput;
  }

  public async execute(input: PutOperationInput) {
    const ddb = createClient(input.region);
    await ddb.put({
      TableName: input.table,
      Item: input.item,
    }).promise();
  }
}
