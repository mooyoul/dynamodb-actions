import * as core from "@actions/core";

import { forgivingJSONParse } from "./helpers";
import { Processor } from "./processor";

const processor = new Processor();

(async () => {
  const input = {
    // Common
    operation: core.getInput("operation")?.toLowerCase(),
    region: core.getInput("region"),
    table: core.getInput("table"),

    // Get / Delete Operation
    key: forgivingJSONParse(core.getInput("key")),
    consistent: forgivingJSONParse(core.getInput("consistent")),

    // Put Operation
    item: forgivingJSONParse(core.getInput("item")),
    file: core.getInput("file"),

    // BatchPut Operation
    items: forgivingJSONParse(core.getInput("items")),
    files: core.getInput("files"),
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
