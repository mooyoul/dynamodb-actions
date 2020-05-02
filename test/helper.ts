import * as DynamoDB from "aws-sdk/clients/dynamodb";

export const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://127.0.0.1:8000";

export function toJS<R, E = Error>(promise: Promise<R>): Promise<[null, R] | [E, null]> {
  return promise.then((v) => [null, v] as [null, R])
    .catch((e) => [e, null] as [E, null]);
}

export const ddb = new DynamoDB({
  endpoint: DYNAMODB_ENDPOINT,
  region: "us-east-1",
});

export const tableName = "dynamodb-actions-test";

beforeEach(async () => {
  await ddb.createTable({
    TableName: tableName,
    KeySchema: [{
      AttributeName: "key",
      KeyType: "HASH",
    }],
    AttributeDefinitions: [{
      AttributeName: "key",
      AttributeType: "S",
    }],
    BillingMode: "PAY_PER_REQUEST",
  }).promise();

  await ddb.waitFor("tableExists", { TableName: tableName });
});

afterEach(async () => {
  await ddb.deleteTable({ TableName: tableName }).promise();

  await ddb.waitFor("tableNotExists", { TableName: tableName });
});
