import * as core from "@actions/core";

import { forgivingJSONParse } from "./helpers";
import { Processor } from "./processor";

const processor = new Processor();

(async () => {
  const input = {
    operation: core.getInput("operation")?.toLowerCase(),
    region: core.getInput("region"),
    table: core.getInput("table"),
    key: forgivingJSONParse(core.getInput("key")),
    item: forgivingJSONParse(core.getInput("item")),
    consistent: forgivingJSONParse(core.getInput("consistent")),
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
