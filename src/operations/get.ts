import * as Joi from "@hapi/joi";
import { createClient } from "../helpers";
import { Operation } from "./base";

const InputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("get").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
  key: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
  consistent: Joi.boolean().default(false).optional(),
}).required();

interface GetOperationInput {
  operation: "get";
  region: string;
  table: string;
  key: { [key: string]: string | number };
  consistent: boolean;
}

export class GetOperation implements Operation<GetOperationInput> {
  public readonly name = "get";

  public async validate(input: unknown): Promise<GetOperationInput> {
    const validationResult = InputSchema.validate(input, {
      stripUnknown: true,
    });
    if (validationResult.error) {
      throw validationResult.error;
    }

    return validationResult.value as GetOperationInput;
  }

  public async execute(input: GetOperationInput) {
    const ddb = createClient(input.region);
    const res = await ddb.get({
      TableName: input.table,
      Key: input.key,
      ConsistentRead: !!input.consistent,
    }).promise();

    return { item: JSON.stringify(res.Item) };
  }
}
