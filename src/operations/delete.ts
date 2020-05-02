import * as Joi from "@hapi/joi";
import { createClient } from "../helpers";
import { Operation } from "./base";

const InputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("delete").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
  key: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
}).required();

export interface DeleteOperationInput {
  operation: "delete";
  region: string;
  table: string;
  key: { [key: string]: string | number };
}

export class DeleteOperation implements Operation<DeleteOperationInput> {
  public readonly name = "delete";

  public async validate(input: unknown): Promise<DeleteOperationInput> {
    const validationResult = InputSchema.validate(input, {
      stripUnknown: true,
    });

    if (validationResult.error) {
      throw validationResult.error;
    }

    return validationResult.value as DeleteOperationInput;
  }

  public async execute(input: DeleteOperationInput) {
    const ddb = createClient(input.region);
    await ddb.delete({
      TableName: input.table,
      Key: input.key,
    }).promise();
  }
}
