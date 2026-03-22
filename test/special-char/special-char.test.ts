import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("ノ・ヶ・々を含む姓", resolve(__dirname, "data.tsv"));
