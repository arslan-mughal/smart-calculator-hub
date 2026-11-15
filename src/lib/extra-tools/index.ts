import type { Calc } from "../tool-types";
import { mathConversionTools } from "./math-conversion";
import { financeHealthTools } from "./finance-health";
import { textRandomDeveloperTools } from "./text-random-developer";
import { mediaSportsTools } from "./media-sports";
import { nextBatchCalcs } from "../next-batch";

export const extraCalcs: Calc[] = [
  ...mathConversionTools,
  ...financeHealthTools,
  ...textRandomDeveloperTools,
  ...mediaSportsTools,
  ...nextBatchCalcs,
];
