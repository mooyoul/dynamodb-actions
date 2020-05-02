"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = require("@hapi/joi");
const helpers_1 = require("../helpers");
const InputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("put").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
    item: Joi.object().required(),
}).required();
class PutOperation {
    constructor() {
        this.name = "put";
    }
    async validate(input) {
        const validationResult = InputSchema.validate(input, {
            stripUnknown: true,
        });
        if (validationResult.error) {
            throw validationResult.error;
        }
        return validationResult.value;
    }
    async execute(input) {
        const ddb = helpers_1.createClient(input.region);
        await ddb.put({
            TableName: input.table,
            Item: input.item,
        }).promise();
    }
}
exports.PutOperation = PutOperation;
