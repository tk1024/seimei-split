import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("全ひらがな/全カタカナ", resolve(__dirname, "data.tsv"));
