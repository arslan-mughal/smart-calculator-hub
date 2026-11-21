import type { Calc } from "../tool-types";
import { mathConversionTools } from "./math-conversion";
import { financeHealthTools } from "./finance-health";
import { textRandomDeveloperTools } from "./text-random-developer";
import { mediaSportsTools } from "./media-sports";
import { nextBatchCalcs } from "../next-batch";
import { batch25FinanceTools } from "./batch25-finance";
import { batch25ConversionTools } from "./batch25-conversion";
import { batch25MathTools } from "./batch25-math";
import { batch25TextDevTools } from "./batch25-text-dev";
import { batch26FinanceTools } from "./batch26-finance";
import { batch26HealthTools } from "./batch26-health";
import { batch26MathTools } from "./batch26-math";
import { batch26TextDevTools } from "./batch26-text-dev";
import { batch27StatsTools } from "./batch27-stats";
import { batch27FinanceTools } from "./batch27-finance";
import { batch27HealthTools } from "./batch27-health";
import { batch27TextDevTools } from "./batch27-text-dev";
import { batch27MiscTools } from "./batch27-misc";
import { batch28SeoTools } from "./batch28-seo";
import { batch29DevTools } from "./batch29-dev";
import { batch29SeoTools } from "./batch29-seo";
import { batch29PetTools } from "./batch29-pets";
import { batch29PlusTools } from "./batch29-plus";

export const extraCalcs: Calc[] = [
  ...mathConversionTools,
  ...financeHealthTools,
  ...textRandomDeveloperTools,
  ...mediaSportsTools,
  ...nextBatchCalcs,
  ...batch25FinanceTools,
  ...batch25ConversionTools,
  ...batch25MathTools,
  ...batch25TextDevTools,
  ...batch26FinanceTools,
  ...batch26HealthTools,
  ...batch26MathTools,
  ...batch26TextDevTools,
  ...batch27StatsTools,
  ...batch27FinanceTools,
  ...batch27HealthTools,
  ...batch27TextDevTools,
  ...batch27MiscTools,
  ...batch28SeoTools,
  ...batch29DevTools,
  ...batch29SeoTools,
  ...batch29PetTools,
  ...batch29PlusTools,
];
