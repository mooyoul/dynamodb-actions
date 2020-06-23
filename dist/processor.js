"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = void 0;
const operations_1 = require("./operations");
class Processor {
    constructor() {
        this.operations = [
            new operations_1.BatchPutOperation(),
            new operations_1.DeleteOperation(),
            new operations_1.GetOperation(),
            new operations_1.PutOperation(),
        ];
    }
    async process(input) {
        for (const operation of this.operations) {
            if (operation.name === input.operation) {
                const validated = await operation.validate(input);
                return operation.execute(validated);
            }
        }
        throw new Error("Unknown operation");
    }
}
exports.Processor = Processor;
