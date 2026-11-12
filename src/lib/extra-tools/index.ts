import type { Calc } from "../tool-types";
import { mathConversionTools } from "./math-conversion";
import { financeHealthTools } from "./finance-health";

export const extraCalcs: Calc[] = [...mathConversionTools, ...financeHealthTools];
