"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOperation = void 0;
const Joi = require("joi");
const fs_1 = require("fs");
const helpers_1 = require("../helpers");
const BaseInputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("update").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
    updateExpression: Joi.string().required()
});
const InputSchema = Joi.alternatives([
    BaseInputSchema.append({
        expressionAttributeValues: Joi.string().required(),
        key: Joi.object().required(),
    }),
    BaseInputSchema.append({
        expressionAttributeFiles: Joi.string().required(),
        key: Joi.object().required(),
    }),
]).required();
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
        const item = input.expressionAttributeValues || await this.read(input.expressionAttributeFiles);
        await ddb.update({
            TableName: input.table,
            Key: input.key,
            UpdateExpression: `set ${input.updateExpression} = :${input.updateExpression}`,
            ExpressionAttributeValues: {
                [`:${input.updateExpression}`]: `${item}`
            }
        }).promise();
    }
    async read(path) {
        const content = await fs_1.promises.readFile(path, { encoding: "utf8" });
        return JSON.parse(content);
    }
}
exports.UpdateOperation = UpdateOperation;
