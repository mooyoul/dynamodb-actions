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
        let updateExp = `set`;
        let attValues = {};
        this.buildExpression(updateExp, input);
        console.log(updateExp);
        await ddb.update({
            TableName: input.table,
            Key: input.key,
            UpdateExpression: updateExp,
            ExpressionAttributeValues: attValues
        }).promise();
    }
    async read(path) {
        const content = await fs_1.promises.readFile(path, { encoding: "utf8" });
        return JSON.parse(content);
    }
    async buildExpression(updateExp, input) {
        const updateExpressions = input.updateExpression.split(',');
        for (let i = 0; i < updateExpressions.length; i++) {
            updateExp.concat(` ${updateExpressions[i]} = :${updateExpressions[i]},`);
        }
    }
    async buildAttributes(updateExp, attValues, input) {
        if (input.expressionAttributeValues) {
            const expAttValues = input.expressionAttributeValues.split(',');
            for (let i = 0; i < expAttValues.length; i++) {
                Object.defineProperty(attValues, `:${updateExp[i]}`, {
                    value: `${expAttValues[i]}`
                });
            }
        }
        else if (input.expressionAttributeFiles) {
            const expAttValues = input.expressionAttributeFiles.split(',');
            for (let i = 0; i < expAttValues.length; i++) {
                Object.defineProperty(attValues, `:${updateExp[i]}`, {
                    value: `${expAttValues[i]}`
                });
            }
        }
    }
}
exports.UpdateOperation = UpdateOperation;
