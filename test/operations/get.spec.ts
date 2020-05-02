import { expect } from "chai";
import { ddb, DYNAMODB_ENDPOINT, tableName, toJS } from "../helper";

import { GetOperation } from "../../src/operations";

describe(GetOperation.name, () => {
  let operation: GetOperation;
  beforeEach(() => {
    operation = new GetOperation();
  });

  describe("#validate", () => {
    context("when given input is not valid", () => {
      it("should throw ValidationError", async () => {
        const scenarios = [{
          operation: "get",
        }, {
          operation: "get",
          region: DYNAMODB_ENDPOINT,
        }, {
          operation: "get",
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
          operation: "get",
          region: "us-east-1",
          table: "table",
          key: {
            key: "foo",
          },
          unknown: "field",
        });

        expect(normalized).to.deep.eq({
          operation: "get",
          region: "us-east-1",
          table: "table",
          key: {
            key: "foo",
          },
          consistent: false,
        });
      });
    });
  });

  describe("#execute", () => {
    context("when operation was failed", () => {
      it("should throw error", async () => {
        const [ e ] = await toJS<unknown, Error>(
          operation.execute({
            operation: "get",
            region: DYNAMODB_ENDPOINT,
            table: tableName,
            key: { unknownKey: "123" },
            consistent: false,
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

      it("should return output", async () => {
        const res = await operation.execute({
          operation: "get",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: {
            key: "foo",
          },
          consistent: false,
        });

        expect(res).to.deep.eq({
          item: JSON.stringify({
            value: "bar",
            createdAt: 12345,
            key: "foo",
          }),
        });
      });

      it("should return output", async () => {
        const res = await operation.execute({
          operation: "get",
          region: DYNAMODB_ENDPOINT,
          table: tableName,
          key: {
            key: "foo",
          },
          consistent: true,
        });

        expect(res).to.deep.eq({
          item: JSON.stringify({
            value: "bar",
            createdAt: 12345,
            key: "foo",
          }),
        });
      });
    });
  });
});
