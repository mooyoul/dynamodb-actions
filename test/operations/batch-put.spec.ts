import { expect } from "chai";
import { ddb, DYNAMODB_ENDPOINT, tableName, toJS } from "../helper";

import { BatchPutOperation } from "../../src/operations";

describe(BatchPutOperation.name, () => {
  let operation: BatchPutOperation;
  beforeEach(() => {
    operation = new BatchPutOperation();
  });

  describe("#validate", () => {
    context("when given input is not valid", () => {
      it("should throw ValidationError", async () => {
        const scenarios = [{
          operation: "batch-put",
        }, {
          operation: "batch-put",
          region: DYNAMODB_ENDPOINT,
        }, {
          operation: "batch-put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
        }];

        for (const scenario of scenarios) {
          const [ e ] = await toJS<unknown, Error>(operation.validate(scenario));

          expect(e).to.be.instanceOf(Error)
            .with.property("name", "ValidationError");
        }
      });
    });

    context("when given input is valid", () => {
      it("should return normalized input", async () => {
        const normalized = await operation.validate({
          operation: "batch-put",
          region: "us-east-1",
          table: "table",
          items: [{
            key: "foo",
            value: 123,
            bool: true,
            empty: null,
            obj: { field: "value" },
            arr: ["is", "fun"],
          }],
          unknown: "field",
        });

        expect(normalized).to.deep.eq({
          operation: "batch-put",
          region: "us-east-1",
          table: "table",
          items: [{
            key: "foo",
            value: 123,
            bool: true,
            empty: null,
            obj: { field: "value" },
            arr: ["is", "fun"],
          }],
        });
      });
    });
  });

  describe("#execute", () => {
    context("with `files` glob", () => {
      it("should throw error if given files glob is invalid", async () => {
        const [ e ] = await toJS<unknown, Error>(
          operation.execute({
            operation: "batch-put",
            region: DYNAMODB_ENDPOINT,
            table: tableName,
            files: "not-exists.json",
          }),
        );

        expect(e).to.be.instanceOf(Error);
      });

      it("should success if operation was succeed", async () => {
        await operation.execute({
          operation: "batch-put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          files: "fixtures/item.json",
        });

        const item = (await ddb.getItem({
          TableName: tableName,
          Key: {
            key: { S: "single" },
          },
        }).promise()).Item;

        expect(item).to.deep.eq({
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
        });
      });

      it("should success if operation was succeed", async () => {
        await operation.execute({
          operation: "batch-put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          files: "fixtures/item*.json",
        });

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

    context("with `items`", () => {
      it("should throw error if operation was failed", async () => {
        const [ e ] = await toJS<unknown, Error>(
          operation.execute({
            operation: "batch-put",
            region: DYNAMODB_ENDPOINT,
            table: tableName,
            items: [{ unknownKey: "123" }],
          }),
        );

        expect(e).to.be.instanceOf(Error);
      });

      it("should success if operation was succeed", async () => {
        await operation.execute({
          operation: "batch-put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          items: [{
            key: "foo",
            value: 123,
            bool: true,
            empty: null,
            obj: { field: "value" },
            arr: ["is", "fun"],
          }, {
            key: "bar",
            value: 777,
          }],
        });

        const items = (await ddb.batchGetItem({
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

        expect(items).to.have.deep.members([{
          key: { S: "foo" },
          value: { N: "123" },
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
          key: { S: "bar" },
          value: { N: "777" },
        }]);
      });
    });
  });
});
