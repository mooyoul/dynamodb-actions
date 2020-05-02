import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as vm from "vm";

export function createClient(endpoint: string): DocumentClient {
  return /^https?/i.test(endpoint) ?
    new DocumentClient({ endpoint, region: "us-east-1" }) :
    new DocumentClient({ region: endpoint });
}

export function forgivingJSONParse(input: string): any {
  try {
    // forgiving JSON parse
    const sandbox = { parsed: null };

    return vm.runInNewContext(`parsed = ${input}`, sandbox, { displayErrors: false });
  } catch (e) { /* no-op */ }
}
