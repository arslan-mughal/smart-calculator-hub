import type { Calc } from "../tool-types";
import { nextFinanceHealthTools } from "./finance-health";
import { nextMathDateTools } from "./math-date";
import { nextConversionTextDeveloperTools } from "./conversion-text-developer";

export const nextBatchCalcs: Calc[] = [
  ...nextFinanceHealthTools,
  ...nextMathDateTools,
  ...nextConversionTextDeveloperTools,
];
