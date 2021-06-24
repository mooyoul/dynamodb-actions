import * as Joi from "joi";
import * as fs from "fs-extra";
import { createClient } from "../helpers";
import { Operation } from "./base"; 

const BaseInputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("update").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
});

const InputSchema = Joi.alternatives([
  BaseInputSchema.append({
    updateExpression: Joi.string().required(),
    expressionAttributeValues: Joi.string().required(),
    key: Joi.object().required(),
  }),
  BaseInputSchema.append({
    updateExpression: Joi.string().required(),
    expressionAttributeValues: Joi.string().required(),
    file: Joi.string().required(),
  }),
]).required();

export type UpdateOperationInput = {
  operation: "update";
  region: string;
  table: string;
} & ({
  updateExpression: string;
  expressionAttributeValues: string;
  key: { [key: string]: any };
  file?: never;
} | {
  updateExpression: string;
  expressionAttributeValues: string;
  key?: never;
  file: string;
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
    const item = input.key || await this.read(input.file);
    
    await ddb.update({
      TableName: input.table,
      Key: item,
      UpdateExpression: `set ${input.updateExpression} = :${input.updateExpression}`,
      ExpressionAttributeValues: {
        [`:${input.updateExpression}`]:`${input.expressionAttributeValues}`
      }
    }).promise();
  }

  private async read(path: string) {
    const content = await fs.readFile(path, { encoding: "utf8" });

    return JSON.parse(content);
  }
}
