import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("3文字以上の姓", resolve(__dirname, "data.tsv"));
