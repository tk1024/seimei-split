import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("漢字姓+ひらがな名", resolve(__dirname, "data.tsv"));
