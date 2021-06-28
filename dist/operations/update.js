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
        let updateExp = ``;
        let attValues = {};
        const expressions = await this.buildExpression(updateExp, input);
        const attributes = await this.buildAttributes(expressions, attValues, input);
        console.log(expressions);
        console.log(attributes);
        await ddb.update({
            TableName: input.table,
            Key: input.key,
            UpdateExpression: expressions,
            ExpressionAttributeValues: attributes
        }).promise();
    }
    async read(path) {
        const content = await fs_1.promises.readFile(path, { encoding: "utf8" });
        return JSON.parse(content);
    }
    async buildExpression(updateExp, input) {
        const updateExpressions = input.updateExpression.split(',');
        for (let i = 0; i < updateExpressions.length; i++) {
            if (i === 0 && updateExpressions.length > 1) {
                updateExp = `set ${updateExpressions[i]} = :${updateExpressions[i]},`;
            }
            else if (i === 0 && updateExpressions.length === 1) {
                updateExp = `set ${updateExpressions[i]} = :${updateExpressions[i]}`;
            }
            else if (i === updateExpressions.length - 1) {
                updateExp += ` ${updateExpressions[i]} = :${updateExpressions[i]}`;
            }
            else {
                updateExp += ` ${updateExpressions[i]} = :${updateExpressions[i]},`;
            }
        }
        return updateExp;
    }
    async buildAttributes(updateExp, attValues, input) {
        const updateExpressions = updateExp.split(',');
        if (input.expressionAttributeValues) {
            const expAttValues = input.expressionAttributeValues.split(', ');
            const keyValues = [];
            for (let i = 0; i < updateExpressions.length; i++) {
                updateExpressions[i] = updateExpressions[i].substring(updateExpressions[i].indexOf(":"));
                keyValues[i] = [updateExpressions[i], expAttValues[i]];
            }
            attValues = Object.fromEntries(keyValues);
        }
        else if (input.expressionAttributeFiles) {
            const expAttValues = input.expressionAttributeFiles.split(',');
            const keyValues = [];
            for (let i = 0; i < updateExpressions.length; i++) {
                updateExpressions[i] = updateExpressions[i].substring(updateExpressions[i].indexOf(":"));
                keyValues[i] = [updateExpressions[i], await this.read(expAttValues[i])];
            }
            attValues = Object.fromEntries(keyValues);
        }
        return attValues;
    }
}
exports.UpdateOperation = UpdateOperation;
