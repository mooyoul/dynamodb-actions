"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteOperation = void 0;
const Joi = require("@hapi/joi");
const helpers_1 = require("../helpers");
const InputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("delete").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
    key: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
}).required();
class DeleteOperation {
    constructor() {
        this.name = "delete";
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
        await ddb.delete({
            TableName: input.table,
            Key: input.key,
        }).promise();
    }
}
exports.DeleteOperation = DeleteOperation;
