import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("1文字姓", resolve(__dirname, "data.tsv"));
