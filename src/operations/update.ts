import * as Joi from "joi";
import { promises as fs } from "fs";
import { createClient } from "../helpers";
import { Operation } from "./base"; 

const BaseInputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("update").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
  updateExpression: Joi.string().required()
});

const InputSchema = Joi.alternatives([
  BaseInputSchema.append({
    expressionAttributeValues: Joi.string().required(),
    key: Joi.object().required(),
  }),
  BaseInputSchema.append({
    expressionAttributeFiles: Joi.string().required(),
    key: Joi.object().required(),
  }),
]).required();

export type UpdateOperationInput = {
  operation: "update";
  region: string;
  table: string;
  updateExpression: string;
} & ({
  expressionAttributeValues: string;
  expressionAttributeFiles?: never;
  key: { [key: string]: any };
} | {
  expressionAttributeValues?: never;
  expressionAttributeFiles: string;
  key: { [key: string]: any };
});

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
    const item = input.expressionAttributeValues || await this.read(input.expressionAttributeFiles!);
    
    await ddb.update({
      TableName: input.table,
      Key: input.key,
      UpdateExpression: `set ${input.updateExpression} = :${input.updateExpression}`,
      ExpressionAttributeValues: {
        [`:${input.updateExpression}`]:`${item}`
      }
    }).promise();
  }

  private async read(path: string) {
    const content = await fs.readFile(path, { encoding: "utf8" });

    return JSON.parse(content);
  }
}
