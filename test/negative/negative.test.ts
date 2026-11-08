import { resolve } from "node:path";
import { runTsvTest } from "../helper";

// Inputs that should stay unsplit because they are not a full name.
// Inputs with a valid full-name reading, such as 京/都, do not belong here.
runTsvTest("名前でない入力", resolve(__dirname, "data.tsv"));
