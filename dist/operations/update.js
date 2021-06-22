"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOperation = void 0;
const Joi = require("joi");
const helpers_1 = require("../helpers");
const InputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("update").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
    key: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
    updateExpression: Joi.string().required(),
    expressionAttributeValues: Joi.string().required()
}).required();
class UpdateOperation {
    constructor() {
        this.name = "update";
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
        await ddb.update({
            TableName: input.table,
            Key: input.key,
            UpdateExpression: input.updateExpression,
            ExpressionAttributeValues: input.expressionAttributeValues
        }).promise();
    }
}
exports.UpdateOperation = UpdateOperation;
