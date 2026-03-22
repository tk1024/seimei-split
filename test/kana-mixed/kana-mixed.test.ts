import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("名前内部にかな混在", resolve(__dirname, "data.tsv"));
