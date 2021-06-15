import * as Joi from "@hapi/joi";
import { createClient } from "../helpers";
import { Operation } from "./base";

const InputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("get").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
  existingKey: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
  constRead: Joi.boolean().default(false).optional(),
}).required();

interface UpdateOperationInput {
  operation: "update";
  region: string;
  table: string;
  existingKey: { [key: string]: string | number };
}

export class UpdateOperation implements Operation<UpdateOperationInput> {
  public readonly name = "get";

  public async validate(input: unknown): Promise<UpdateOperationInput> {
    const validationResult = InputSchema.validate(input, {
      stripUnknown: true,
    });
    if (validationResult.error) {
      throw validationResult.error;
    }

    return validationResult.value as UpdateOperationInput;
  }

  public async execute(input: UpdateOperationInput) {
    const ddb = createClient(input.region);
    const res = await ddb.update({
      TableName: input.table,
      Key: input.existingKey,
    }).promise();
  }
}