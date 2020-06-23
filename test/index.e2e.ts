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
