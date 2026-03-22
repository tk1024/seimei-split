import { resolve } from "node:path";
import { runTsvTest } from "../helper";

runTsvTest("VTuber名", resolve(__dirname, "data.tsv"));
