import { resolve } from "node:path";
import { runTsvTest } from "../helper";

// Inputs that are not a full name and should stay unsplit.
// Known wrong splits are recorded in baseline.tsv until they are fixed.
runTsvTest("名前でない入力", resolve(__dirname, "data.tsv"), { allowWrongSplits: true });
