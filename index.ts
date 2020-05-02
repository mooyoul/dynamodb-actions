import * as core from "@actions/core";
import * as Joi from "@hapi/joi";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as vm from "vm";

interface KeyOperationInput {
  operation: "get" | "delete";
  region: string;
  table: string;
  key: { [key: string]: string | number };
}

interface ItemOperationInput {
  operation: "put";
  region: string;
  table: string;
  item: { [key: string]: any };
}

type Input = KeyOperationInput | ItemOperationInput;

const InputSchema = Joi.object({
  operation: Joi.string().lowercase().valid("get", "put", "delete").required(),
  region: Joi.string().lowercase().required(),
  table: Joi.string().required(),
  key: Joi.when("operation", {
    is: "put",
    then: Joi.forbidden(),
    otherwise: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
  }),
  item: Joi.when("operation", {
    is: "put",
    then: Joi.object().required(),
    otherwise: Joi.forbidden(),
  }),
}).required();

function getInput(): Input {
  const input: { [key: string]: any } = {
    operation: core.getInput("operation", { required: true }),
    region: core.getInput("region", { required: true }),
    table: core.getInput("table", { required: true }),
  };

  const [ key, item ] = [core.getInput("key"), core.getInput("item")].map((v) => {
    try {
      // forgiving JSON parse
      const sandbox = { parsed: null };

      return vm.runInNewContext(`parsed = ${v}`, sandbox, { displayErrors: false });
    } catch (e) { /* no op */ }
  });

  if (key) {
    input.key = key;
  }

  if (item) {
    input.item = item;
  }

  const validationResult = InputSchema.validate(input);
  if (validationResult.error) {
    throw validationResult.error;
  }

  return validationResult.value as Input;
}

(async () => {
  const input = getInput();

  switch (input.operation) {
    case "get": return getItem(input as KeyOperationInput);
    case "put": return putItem(input as ItemOperationInput);
    case "delete": return deleteItem(input as KeyOperationInput);
    default: {
      throw new Error("Unknown Operation Type");
    }
  }
})().catch((e) => {
  console.error(e.stack); // tslint:disable-line
  core.setFailed(e.message);
});

function createClient(endpoint: string): DocumentClient {
  return /^https?/i.test(endpoint) ?
    new DocumentClient({ endpoint, region: "us-east-1" }) :
    new DocumentClient({ region: endpoint });
}

async function getItem(input: KeyOperationInput): Promise<void> {
  const ddb = createClient(input.region);
  const res = await ddb.get({
    TableName: input.table,
    Key: input.key,
  }).promise();

  core.setOutput("item", JSON.stringify(res.Item));
}

async function putItem(input: ItemOperationInput): Promise<void> {
  const ddb = createClient(input.region);
  await ddb.put({
    TableName: input.table,
    Item: input.item,
  }).promise();
}

async function deleteItem(input: KeyOperationInput): Promise<void> {
  const ddb = createClient(input.region);
  await ddb.delete({
    TableName: input.table,
    Key: input.key,
  }).promise();
}
