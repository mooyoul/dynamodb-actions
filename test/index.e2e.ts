import { expect } from "chai";
import * as execa from "execa";
import { ddb, DYNAMODB_ENDPOINT, tableName, toJS } from "./helper";

export async function invokeAction(input: { [key: string]: string | undefined }) {
  const res = await execa("ts-node", ["src/index.ts"], {
    preferLocal: true,
    env: Object.fromEntries(
      Object.entries(input).map(([key, value]) => [`INPUT_${key.toUpperCase()}`, value]),
    ),
  });

  return res;
}

describe("dynamodb-actions", () => {
  describe("#get", () => {
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

  describe("#put", () => {
    context("with item", () => {
      it("should put record", async () => {
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

    context("with file", () => {
      it("should put record", async () => {
        const [ e, res ] = await toJS<execa.ExecaReturnValue, unknown>(invokeAction({
          operation: "put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          file: "fixtures/item.json",
        }));

        expect(e).to.eq(null);
        expect(res?.exitCode).to.eq(0);
        expect(res?.stdout).to.eq("");

        const saved = await ddb.getItem({
          TableName: tableName,
          Key: {
            key: { S: "single" },
          },
        }).promise();

        const item = saved.Item;
        expect(item?.key).to.deep.eq({ S: "single" });
        expect(item?.value).to.deep.eq({ N: "1" });
      });
    });
  });

  describe("#batch-put", () => {
    context("with items", () => {
      it("should batchPut records", async () => {
        const [ e, res ] = await toJS<execa.ExecaReturnValue, unknown>(invokeAction({
          operation: "batch-put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          items: JSON.stringify([{
            key: "foo",
            some: "one",
            timestamp: 1,
          }, {
            key: "bar",
            some: "two",
            timestamp: 2,
          }]),
        }));

        expect(e).to.eq(null);
        expect(res?.exitCode).to.eq(0);
        expect(res?.stdout).to.eq("");

        const saved = (await ddb.batchGetItem({
          RequestItems: {
            [tableName]: {
              Keys: [{
                key: { S: "foo" },
              }, {
                key: { S: "bar" },
              }],
            },
          },
        }).promise()).Responses?.[tableName];

        expect(saved).to.have.deep.members([{
          key: { S: "foo" },
          some: { S: "one" },
          timestamp: { N: "1" },
        }, {
          key: { S: "bar" },
          some: { S: "two" },
          timestamp: { N: "2" },
        }]);
      });
    });

    context("with files", () => {
      it("should put records", async () => {
        const [ e, res ] = await toJS<execa.ExecaReturnValue, unknown>(invokeAction({
          operation: "batch-put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          files: "fixtures/*.json",
        }));

        expect(e).to.eq(null);
        expect(res?.exitCode).to.eq(0);

        const items = (await ddb.batchGetItem({
          RequestItems: {
            [tableName]: {
              Keys: [{
                key: { S: "single" },
              }, {
                key: { S: "single2" },
              }, {
                key: { S: "single3" },
              }],
            },
          },
        }).promise()).Responses?.[tableName];

        expect(items).to.have.deep.members([{
          key: { S: "single" },
          value: { N: "1" },
          bool: { BOOL: true },
          empty: { NULL: true },
          obj: {
            M: {
              field: { S: "value" },
            },
          },
          arr: {
            L: [{ S: "is" }, { S: "fun" }],
          },
        }, {
          key: { S: "single2" },
          value: { N: "2" },
          bool: { BOOL: true },
          empty: { NULL: true },
          obj: {
            M: {
              field: { S: "value" },
            },
          },
          arr: {
            L: [{ S: "is" }, { S: "fun" }],
          },
        }, {
          key: { S: "single3" },
          value: { N: "3" },
          bool: { BOOL: true },
          empty: { NULL: true },
          obj: {
            M: {
              field: { S: "value" },
            },
          },
          arr: {
            L: [{ S: "is" }, { S: "fun" }],
          },
        }]);
      });
    });
  });

  describe("#delete", () => {
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
