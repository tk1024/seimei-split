import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("異体字・旧字体", resolve(__dirname, "data.tsv"));
