import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("MVP (208件)", resolve(__dirname, "data.tsv"));
