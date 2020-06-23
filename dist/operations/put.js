"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PutOperation = void 0;
const Joi = require("@hapi/joi");
const fs_1 = require("fs");
const helpers_1 = require("../helpers");
const BaseInputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("put").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
});
const InputSchema = Joi.alternatives([
    BaseInputSchema.append({
        item: Joi.object().required(),
    }),
    BaseInputSchema.append({
        file: Joi.string().required(),
    }),
]).required();
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
        const item = input.item || await this.read(input.file);
        await ddb.put({
            TableName: input.table,
            Item: item,
        }).promise();
    }
    async read(path) {
        const content = await fs_1.promises.readFile(path, { encoding: "utf8" });
        return JSON.parse(content);
    }
}
exports.PutOperation = PutOperation;
