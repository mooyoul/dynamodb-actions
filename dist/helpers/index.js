"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgivingJSONParse = exports.createClient = void 0;
const dynamodb_1 = require("aws-sdk/clients/dynamodb");
const vm = require("vm");
function createClient(endpoint) {
    return /^https?/i.test(endpoint) ?
        new dynamodb_1.DocumentClient({ endpoint, region: "us-east-1" }) :
        new dynamodb_1.DocumentClient({ region: endpoint });
}
exports.createClient = createClient;
function forgivingJSONParse(input) {
    try {
        // forgiving JSON parse
        const sandbox = { parsed: null };
        return vm.runInNewContext(`parsed = ${input}`, sandbox, { displayErrors: false });
    }
    catch (e) { /* no-op */ }
}
exports.forgivingJSONParse = forgivingJSONParse;
