"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchPutOperation = void 0;
const glob = require("@actions/glob");
const Joi = require("@hapi/joi");
const fs_1 = require("fs");
const helpers_1 = require("../helpers");
const BaseInputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("batch-put").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
});
const InputSchema = Joi.alternatives([
    BaseInputSchema.append({
        items: Joi.array().items(Joi.object().required()).min(1).required(),
    }),
    BaseInputSchema.append({
        files: Joi.string().required(),
    }),
]).required();
class BatchPutOperation {
    constructor() {
        this.name = "batch-put";
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
        var _a, _b;
        const ddb = helpers_1.createClient(input.region);
        const items = input.items || await this.read(input.files);
        const chunks = this.chunk(items, 20);
        for (const chunk of chunks) {
            const res = await ddb.batchWrite({
                RequestItems: {
                    [input.table]: chunk.map((item) => ({
                        PutRequest: {
                            Item: item,
                        },
                    })),
                },
            }).promise();
            const failedItems = (_b = (_a = res.UnprocessedItems) === null || _a === void 0 ? void 0 : _a[input.table]) !== null && _b !== void 0 ? _b : [];
            if (failedItems.length > 0) {
                console.error("UnprocessedItems: ", res.UnprocessedItems); // tslint:disable-line
                throw new Error("Got UnprocessedItems from DynamoDB");
            }
        }
    }
    async read(globs) {
        const globber = await glob.create(globs);
        const files = await globber.glob();
        if (files.length === 0) {
            throw new Error("Given glob does not match any files");
        }
        return Promise.all(files.map(async (file) => {
            const content = await fs_1.promises.readFile(file, { encoding: "utf8" });
            return JSON.parse(content);
        }));
    }
    chunk(items, size) {
        return items.reduce((collection, item) => {
            const lastChunk = collection[collection.length - 1];
            if (lastChunk.length < 20) {
                lastChunk.push(item);
            }
            else {
                collection.push([item]);
            }
            return collection;
        }, [[]]);
    }
}
exports.BatchPutOperation = BatchPutOperation;
