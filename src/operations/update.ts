import * as Joi from "@hapi/joi";
import { createClient } from "../helpers";
import { Operation } from "./base";

const InputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("update").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
  key: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
  consistent: Joi.boolean().default(false).optional(),
}).required();

interface UpdateOperationInput {
  operation: "update";
  region: string;
  table: string;
  key: { [key: string]: string | number };
  consistent: boolean;
}

export class UpdateOperation implements Operation<UpdateOperationInput> {
  public readonly name = "update";

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
      Key: input.key,
    }).promise();
  }
}
