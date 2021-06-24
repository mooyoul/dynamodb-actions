"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const helpers_1 = require("./helpers");
const processor_1 = require("./processor");
const processor = new processor_1.Processor();
(async () => {
    var _a;
    const input = {
        // Common
        operation: (_a = core.getInput("operation")) === null || _a === void 0 ? void 0 : _a.toLowerCase(),
        region: core.getInput("region"),
        table: core.getInput("table"),
        // Get / Delete / Update Operation
        key: helpers_1.forgivingJSONParse(core.getInput("key")),
        consistent: helpers_1.forgivingJSONParse(core.getInput("consistent")),
        // Put Operation
        item: helpers_1.forgivingJSONParse(core.getInput("item")),
        file: core.getInput("file"),
        // BatchPut Operation
        items: helpers_1.forgivingJSONParse(core.getInput("items")),
        files: core.getInput("files"),
        // Update Operation
        updateExpression: core.getInput("updateExpression"),
        expressionAttributeValues: core.getInput("expressionAttributeValues"),
        expressionAttributeFiles: core.getInput("expressionAttributeFiles")
    };
    const output = await processor.process(input);
    if (output) {
        for (const [key, value] of Object.entries(output)) {
            core.setOutput(key, value);
        }
    }
})().catch((e) => {
    console.error(e.stack); // tslint:disable-line
    core.setFailed(e.message);
});
