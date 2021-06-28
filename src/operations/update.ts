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
    let updateExp = ``;
    let attValues = {};

    const expressions = await this.buildExpression(updateExp, input);
    const attributes = await this.buildAttributes(expressions, attValues, input);

    console.log(expressions);
    console.log(attributes);

    await ddb.update({
      TableName: input.table,
      Key: input.key,
      UpdateExpression: expressions,
      ExpressionAttributeValues: attributes
    }).promise();
  }

  private async read(path: string) {
    const content = await fs.readFile(path, { encoding: "utf8" });

    return JSON.parse(content);
  }

  private async buildExpression(updateExp: string, input: UpdateOperationInput) {
    const updateExpressions = input.updateExpression.split(',');

    for(let i=0; i<updateExpressions.length; i++) {
      if(i===0 && updateExpressions.length > 1) {
        updateExp = `set ${updateExpressions[i]} = :${updateExpressions[i]},`;
      }
      else if(i===0 && updateExpressions.length === 1) {
        updateExp = `set ${updateExpressions[i]} = :${updateExpressions[i]}`;
      }
      else if(i===updateExpressions.length-1) {
        updateExp += ` ${updateExpressions[i]} = :${updateExpressions[i]}`;
      }
      else {
        updateExp += ` ${updateExpressions[i]} = :${updateExpressions[i]},`;
      }
    }

    return updateExp;
  }

  private async buildAttributes(updateExp: string, attValues: {}, input: UpdateOperationInput) {
    const updateExpressions = updateExp.split(',');

    if(input.expressionAttributeValues) {
      const expAttValues = input.expressionAttributeValues.split(', ');
      const keyValues = [];

      for(let i=0; i<updateExpressions.length; i++) {
        updateExpressions[i] = updateExpressions[i].substring(updateExpressions[i].indexOf(":"));
        keyValues[i] = [updateExpressions[i], expAttValues[i]];
      }

      attValues = Object.fromEntries(keyValues);
    }
    else if(input.expressionAttributeFiles) {
      const expAttValues = input.expressionAttributeFiles!.split(',');
      const keyValues = [];

      for(let i=0; i<updateExpressions.length; i++) {
        updateExpressions[i] = updateExpressions[i].substring(updateExpressions[i].indexOf(":"));
        keyValues[i] = [updateExpressions[i], await this.read(expAttValues[i])];
      }

      attValues = Object.fromEntries(keyValues);
    }

    return attValues;
  }
}