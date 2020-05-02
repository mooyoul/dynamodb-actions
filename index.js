"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const Joi = require("@hapi/joi");
const dynamodb_1 = require("aws-sdk/clients/dynamodb");
const vm = require("vm");
const InputSchema = Joi.object({
    operation: Joi.string().lowercase().valid("get", "put", "delete").required(),
    region: Joi.string().lowercase().required(),
    table: Joi.string().required(),
    key: Joi.when("operation", {
        is: "put",
        then: Joi.forbidden(),
        otherwise: Joi.object().pattern(/./, Joi.alternatives().try(Joi.string(), Joi.number())).min(1).max(2).required(),
    }),
    item: Joi.when("operation", {
        is: "put",
        then: Joi.object().required(),
        otherwise: Joi.forbidden(),
    }),
}).required();
function getInput() {
    const input = {
        operation: core.getInput("operation", { required: true }),
        region: core.getInput("region", { required: true }),
        table: core.getInput("table", { required: true }),
    };
    const [key, item] = [core.getInput("key"), core.getInput("item")].map((v) => {
        try {
            // forgiving JSON parse
            const sandbox = { parsed: null };
            return vm.runInNewContext(`parsed = ${v}`, sandbox, { displayErrors: false });
        }
        catch (e) { /* no op */ }
    });
    if (key) {
        input.key = key;
    }
    if (item) {
        input.item = item;
    }
    const validationResult = InputSchema.validate(input);
    if (validationResult.error) {
        throw validationResult.error;
    }
    return validationResult.value;
}
(async () => {
    const input = getInput();
    switch (input.operation) {
        case "get": return getItem(input);
        case "put": return putItem(input);
        case "delete": return deleteItem(input);
        default: {
            throw new Error("Unknown Operation Type");
        }
    }
})().catch((e) => {
    console.error(e.stack); // tslint:disable-line
    core.setFailed(e.message);
});
function createClient(endpoint) {
    return /^https?/i.test(endpoint) ?
        new dynamodb_1.DocumentClient({ endpoint, region: "us-east-1" }) :
        new dynamodb_1.DocumentClient({ region: endpoint });
}
async function getItem(input) {
    const ddb = createClient(input.region);
    const res = await ddb.get({
        TableName: input.table,
        Key: input.key,
    }).promise();
    core.setOutput("item", JSON.stringify(res.Item));
}
async function putItem(input) {
    const ddb = createClient(input.region);
    await ddb.put({
        TableName: input.table,
        Item: input.item,
    }).promise();
}
async function deleteItem(input) {
    const ddb = createClient(input.region);
    await ddb.delete({
        TableName: input.table,
        Key: input.key,
    }).promise();
}
