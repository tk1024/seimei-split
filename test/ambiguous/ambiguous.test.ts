import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("分割が曖昧な名前", resolve(__dirname, "data.tsv"));
