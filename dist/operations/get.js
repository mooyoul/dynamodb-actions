"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetOperation = void 0;
const Joi = require("@hapi/joi");
const helpers_1 = require("../helpers");
const InputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("get").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
    key: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
    consistent: Joi.boolean().default(false).optional(),
}).required();
class GetOperation {
    constructor() {
        this.name = "get";
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
        const res = await ddb.get({
            TableName: input.table,
            Key: input.key,
            ConsistentRead: !!input.consistent,
        }).promise();
        return { item: JSON.stringify(res.Item) };
    }
}
exports.GetOperation = GetOperation;
