import * as Joi from "@hapi/joi";
import { promises as fs } from "fs";
import { createClient } from "../helpers";
import { Operation } from "./base";

const BaseInputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("put").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
});

const InputSchema = Joi.alternatives([
  BaseInputSchema.append({
    item: Joi.object().required(),
  }),
  BaseInputSchema.append({
    file: Joi.string().required(),
  }),
]).required();

export type PutOperationInput = {
  operation: "put";
  region: string;
  table: string;
} & ({
  item: { [key: string]: any };
  file?: never;
} | {
  item?: never;
  file: string;
});

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
    const item = input.item || await this.read(input.file);

    await ddb.put({
      TableName: input.table,
      Item: item,
    }).promise();
  }

  private async read(path: string) {
    const content = await fs.readFile(path, { encoding: "utf8" });

    return JSON.parse(content);
  }
}
