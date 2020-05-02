import * as DynamoDB from "aws-sdk/clients/dynamodb";
import { expect } from "chai";
import * as execa from "execa";

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://127.0.0.1:8000";

export function toJS<R, E = Error>(promise: Promise<R>): Promise<[null, R] | [E, null]> {
  return promise.then((v) => [null, v] as [null, R])
    .catch((e) => [e, null] as [E, null]);
}

async function invokeAction(input: { [key: string]: string | undefined }) {
  const res = await execa("ts-node", ["index.ts"], {
    preferLocal: true,
    env: Object.fromEntries(
      Object.entries(input).map(([key, value]) => [`INPUT_${key.toUpperCase()}`, value]),
    ),
  });

  return res;
}

describe("dynamodb-actions", () => {
  const ddb = new DynamoDB({
    endpoint: DYNAMODB_ENDPOINT,
    region: "us-east-1",
  });

  const tableName = "dynamodb-actions-test";

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

  describe("#get", () => {
    context("when operation was failed", () => {
      it("should fail", async () => {
        const scenarios = [{
          operation: "get",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: JSON.stringify({ unknownKey: "123" }),
        }, {
          operation: "get",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: JSON.stringify({ key: 123 }),
        }, {
          operation: "get",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: "abc",
        }];

        await Promise.all(scenarios.map(async (scenario) => {
          const [ e ] = await toJS<unknown, execa.ExecaError>(invokeAction(scenario));

          expect(e).to.be.instanceOf(Error)
            .with.property("exitCode", 1);
        }));
      });
    });

    context("when operation was succeed", () => {
      beforeEach(async () => {
        await ddb.putItem({
          TableName: tableName,
          Item: {
            key: { S: "foo" },
            value: { S: "bar" },
            createdAt: { N: "12345" },
          },
        }).promise();
      });

      it("should set output", async () => {
        const [ e, res ] = await toJS<execa.ExecaReturnValue, unknown>(invokeAction({
          operation: "get",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: JSON.stringify({
            key: "foo",
          }),
        }));

        expect(e).to.eq(null);
        expect(res?.exitCode).to.eq(0);
        expect(res?.stdout).to.eq(`::set-output name=item::{"value":"bar","createdAt":12345,"key":"foo"}`);
      });
    });
  });

  describe("#put", () => {
    context("when operation was failed", () => {
      it("should fail", async () => {
        const scenarios = [ {
          operation: "put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          item: JSON.stringify({ unknownKey: "123" }),
        }, {
          operation: "put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          item: JSON.stringify({ key: 123 }),
        }, {
          operation: "put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          item: "abc",
        } ];

        await Promise.all(scenarios.map(async (scenario) => {
          const [ e ] = await toJS<unknown, execa.ExecaError>(invokeAction(scenario));

          expect(e).to.be.instanceOf(Error)
            .with.property("exitCode", 1);
        }));
      });
    });

    context("when operation was succeed", () => {
      it("should success", async () => {
        const [ e, res ] = await toJS<execa.ExecaReturnValue, unknown>(invokeAction({
          operation: "put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          item: JSON.stringify({
            key: "foo",
            some: "value",
            timestamp: 12345,
          }),
        }));

        expect(e).to.eq(null);
        expect(res?.exitCode).to.eq(0);
        expect(res?.stdout).to.eq("");

        const saved = await ddb.getItem({
          TableName: tableName,
          Key: {
            key: { S: "foo" },
          },
        }).promise();

        const item = saved.Item;
        expect(item?.key).to.deep.eq({ S: "foo" });
        expect(item?.some).to.deep.eq({ S: "value" });
        expect(item?.timestamp).to.deep.eq({ N: "12345" });
      });
    });
  });

  describe("#delete", () => {
    context("when operation was failed", () => {
      it("should fail", async () => {
        const scenarios = [{
          operation: "delete",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: JSON.stringify({ unknownKey: "123" }),
        }, {
          operation: "delete",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: JSON.stringify({ key: 123 }),
        }, {
          operation: "delete",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: "abc",
        }];

        await Promise.all(scenarios.map(async (scenario) => {
          const [ e ] = await toJS<unknown, execa.ExecaError>(invokeAction(scenario));

          expect(e).to.be.instanceOf(Error)
            .with.property("exitCode", 1);
        }));
      });
    });

    context("when operation was succeed", () => {
      beforeEach(async () => {
        await ddb.putItem({
          TableName: tableName,
          Item: {
            key: { S: "foo" },
            value: { S: "bar" },
            createdAt: { N: "12345" },
          },
        }).promise();
      });

      it("should success", async () => {
        const [ e, res ] = await toJS<execa.ExecaReturnValue, unknown>(invokeAction({
          operation: "delete",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: JSON.stringify({
            key: "foo",
          }),
        }));

        expect(e).to.eq(null);
        expect(res?.exitCode).to.eq(0);
        expect(res?.stdout).to.eq("");

        const saved = await ddb.getItem({
          TableName: tableName,
          Key: {
            key: { S: "foo" },
          },
        }).promise();

        expect(saved.Item).to.eq(undefined);
      });
    });
  });
});
