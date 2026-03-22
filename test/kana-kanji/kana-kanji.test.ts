import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("かな姓+漢字名", resolve(__dirname, "data.tsv"));
