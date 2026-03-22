import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("漢字姓+カタカナ名", resolve(__dirname, "data.tsv"));
