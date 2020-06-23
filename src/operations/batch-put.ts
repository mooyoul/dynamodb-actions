import * as glob from "@actions/glob";
import * as Joi from "@hapi/joi";
import { promises as fs } from "fs";
import { createClient } from "../helpers";
import { Operation } from "./base";

const BaseInputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("batch-put").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
});

const InputSchema = Joi.alternatives([
  BaseInputSchema.append({
    items: Joi.array().items(Joi.object().required()).min(1).required(),
  }),
  BaseInputSchema.append({
    files: Joi.string().required(),
  }),
]).required();

type Item = { [key: string]: any };

export type BatchPutOperationInput = {
  operation: "batch-put";
  region: string;
  table: string;
} & ({
  items: Item[];
  files?: never;
} | {
  items?: never;
  files: string;
});

export class BatchPutOperation implements Operation<BatchPutOperationInput> {
  public readonly name = "batch-put";

  public async validate(input: unknown): Promise<BatchPutOperationInput> {
    const validationResult = InputSchema.validate(input, {
      stripUnknown: true,
    });
    if (validationResult.error) {
      throw validationResult.error;
    }

    return validationResult.value as BatchPutOperationInput;
  }

  public async execute(input: BatchPutOperationInput) {
    const ddb = createClient(input.region);
    const items = input.items || await this.read(input.files);

    const chunks: Item[][] = this.chunk(items, 20);

    for (const chunk of chunks) {
      const res = await ddb.batchWrite({
        RequestItems: {
          [input.table]: chunk.map((item) => ({
            PutRequest: {
              Item: item,
            },
          })),
        },
      }).promise();

      const failedItems = res.UnprocessedItems?.[input.table] ?? [];
      if (failedItems.length > 0) {
        console.error("UnprocessedItems: ", res.UnprocessedItems); // tslint:disable-line
        throw new Error("Got UnprocessedItems from DynamoDB");
      }
    }
  }

  private async read(globs: string) {
    const globber = await glob.create(globs);
    const files = await globber.glob();

    if (files.length === 0) {
      throw new Error("Given glob does not match any files");
    }

    return Promise.all(files.map(async (file) => {
      const content = await fs.readFile(file, { encoding: "utf8" });

      return JSON.parse(content);
    }));
  }

  private chunk<T>(items: T[], size: number): T[][] {
    return items.reduce((collection, item) => {
      const lastChunk = collection[collection.length - 1];
      if (lastChunk.length < 20) {
        lastChunk.push(item);
      } else {
        collection.push([item]);
      }
      return collection;
    }, [[]] as T[][]);
  }
}
