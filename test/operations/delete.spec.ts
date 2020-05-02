import { expect } from "chai";
import { ddb, DYNAMODB_ENDPOINT, tableName, toJS } from "../helper";

import { DeleteOperation } from "../../src/operations";

describe(DeleteOperation.name, () => {
  let operation: DeleteOperation;
  beforeEach(() => {
    operation = new DeleteOperation();
  });

  describe("#validate", () => {
    context("when given input is not valid", () => {
      it("should throw ValidationError", async () => {
        const scenarios = [{
          operation: "delete",
        }, {
          operation: "delete",
          region: DYNAMODB_ENDPOINT,
        }, {
          operation: "delete",
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
          operation: "delete",
          region: "us-east-1",
          table: "table",
          key: {
            key: "foo",
          },
          unknown: "field",
        });

        expect(normalized).to.deep.eq({
          operation: "delete",
          region: "us-east-1",
          table: "table",
          key: {
            key: "foo",
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
            operation: "delete",
            region: DYNAMODB_ENDPOINT,
            table: tableName,
            key: { unknownKey: "123" },
          }),
        );

        expect(e).to.be.instanceOf(Error);
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
        await operation.execute({
          operation: "delete",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: {
            key: "foo",
          },
        });

        const item = (await ddb.getItem({
          TableName: tableName,
          Key: {
            key: { S: "foo "},
          },
        }).promise()).Item;

        expect(item).to.eq(undefined);
      });
    });
  });
});
