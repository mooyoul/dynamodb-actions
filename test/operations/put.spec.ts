import { expect } from "chai";
import { ddb, DYNAMODB_ENDPOINT, tableName, toJS } from "../helper";

import { PutOperation } from "../../src/operations";

describe(PutOperation.name, () => {
  let operation: PutOperation;
  beforeEach(() => {
    operation = new PutOperation();
  });

  describe("#validate", () => {
    context("when given input is not valid", () => {
      it("should throw ValidationError", async () => {
        const scenarios = [{
          operation: "put",
        }, {
          operation: "put",
          region: DYNAMODB_ENDPOINT,
        }, {
          operation: "put",
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
          operation: "put",
          region: "us-east-1",
          table: "table",
          item: {
            key: "foo",
            value: 123,
            bool: true,
            empty: null,
            obj: { field: "value" },
            arr: ["is", "fun"],
          },
          unknown: "field",
        });

        expect(normalized).to.deep.eq({
          operation: "put",
          region: "us-east-1",
          table: "table",
          item: {
            key: "foo",
            value: 123,
            bool: true,
            empty: null,
            obj: { field: "value" },
            arr: ["is", "fun"],
          },
        });
      });
    });
  });

  describe("#execute", () => {
    context("when operation was failed", () => {
      it("should throw error", async () => {
        const [ e ] = await toJS<unknown, Error>(
          operation.execute({
            operation: "put",
            region: DYNAMODB_ENDPOINT,
            table: tableName,
            item: { unknownKey: "123" },
          }),
        );

        expect(e).to.be.instanceOf(Error);
      });
    });

    context("when operation was succeed", () => {
      it("should success", async () => {
        await operation.execute({
          operation: "put",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          item: {
            key: "foo",
            value: 123,
            bool: true,
            empty: null,
            obj: { field: "value" },
            arr: ["is", "fun"],
          },
        });

        const item = (await ddb.getItem({
          TableName: tableName,
          Key: {
            key: { S: "foo" },
          },
        }).promise()).Item;

        expect(item).to.deep.eq({
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
        });
      });
    });
  });
});
