import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Check, Lightbulb, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { bySlug } from "@/lib/registry";
import { recommendCalculator, type CalculatorFinderResponse } from "@/lib/calculator-finder.functions";
import { ToolIcon } from "./tool-card";

const examples = [
  "I want a mortgage of $350,000 at 6.5% for 30 years. What will I pay monthly?",
  "How many calories does a 75 kg person burn walking briskly for 45 minutes?",
  "Convert 30 US miles per gallon into litres per 100 km.",
];

export function AiCalculatorFinder() {
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<CalculatorFinderResponse | null>(null);
  const requestNumber = useRef(0);
  const callRecommendation = useServerFn(recommendCalculator);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < 8) {
      setResponse({ ok: false, error: "Describe the calculation in a little more detail (at least 8 characters)." });
      return;
    }
    const currentRequest = ++requestNumber.current;
    setPending(true);
    setResponse(null);
    try {
      const result = await callRecommendation({ data: { description: trimmed } });
      if (currentRequest === requestNumber.current) setResponse(result);
    } catch (error) {
      if (currentRequest === requestNumber.current) {
        setResponse({
          ok: false,
          error: error instanceof Error ? error.message : "The recommendation could not be completed. Please try again.",
        });
      }
    } finally {
      if (currentRequest === requestNumber.current) setPending(false);
    }
  }

  const recommendation = response?.ok ? response.recommendation : null;
  const tool = recommendation ? bySlug[recommendation.slug] : undefined;

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8" aria-labelledby="ai-finder-title">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
          <div className="bg-primary p-7 text-primary-foreground sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold text-accent">
              <WandSparkles className="size-3.5" /> AI calculator finder
            </span>
            <h2 id="ai-finder-title" className="mt-5 font-display text-3xl font-extrabold leading-tight">
              Describe the answer you need.
            </h2>
            <p className="mt-4 text-sm leading-7 text-primary-foreground/70">
              Not sure which tool fits? Explain your task in everyday language. Lovable AI will match it to a calculator and tell you what to enter in each field.
            </p>
            <div className="mt-6 space-y-3 text-xs leading-5 text-primary-foreground/65">
              <p className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" /> A direct link to the best matching tool</p>
              <p className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" /> Suggested values and field-by-field guidance</p>
              <p className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" /> Alternative tools when another approach may help</p>
            </div>
            <p className="mt-7 border-t border-primary-foreground/15 pt-5 text-xs leading-5 text-primary-foreground/60">
              Your description is sent to Lovable AI for this recommendation. Do not include names, account numbers or other sensitive details.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={submit}>
              <label htmlFor="calculation-description" className="text-sm font-bold">What would you like to calculate?</label>
              <textarea
                id="calculation-description"
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 600))}
                placeholder="For example: I earn $25 an hour and work 38 hours a week. What is my yearly salary?"
                rows={4}
                maxLength={600}
                className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
                <span>Include known values, units and what you want to find.</span>
                <span className="shrink-0">{description.length}/600</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => { setDescription(example); setResponse(null); }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    {["Mortgage payment", "Exercise calories", "Fuel economy"][index]}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={pending}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/85 disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {pending ? "Finding the best match…" : "Find my calculator"}
              </button>
            </form>

            <div aria-live="polite">
              {response && !response.ok && (
                <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <div><p className="font-bold">We couldn’t find a recommendation</p><p className="mt-1 leading-6 text-muted-foreground">{response.error}</p></div>
                </div>
              )}

              {recommendation && tool && (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-secondary/45 p-5">
                  <p className="section-kicker">Recommended for you</p>
                  <div className="mt-3 flex items-start gap-3">
                    <span className="rounded-xl bg-card p-2.5 text-primary"><ToolIcon category={tool.category} className="size-5" /></span>
                    <div>
                      <Link to="/$slug" params={{ slug: tool.slug }} className="inline-flex items-center gap-2 font-display text-xl font-extrabold text-primary hover:underline">
                        {tool.name} <ArrowRight className="size-4" />
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.explanation}</p>
                    </div>
                  </div>

                  {recommendation.inputGuidance.length > 0 && (
                    <div className="mt-5">
                      <h3 className="flex items-center gap-2 text-sm font-bold"><Lightbulb className="size-4 text-primary" /> What to enter</h3>
                      <div className="mt-3 space-y-2">
                        {recommendation.inputGuidance.map((input) => (
                          <div key={input.key} className="rounded-xl border border-border bg-card p-3.5">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm font-bold">{input.label}</p>
                              <p className="rounded-md bg-secondary px-2 py-1 text-xs font-bold text-primary">{input.value}</p>
                            </div>
                            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{input.instruction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendation.missingInformation && (
                    <p className="mt-4 rounded-lg bg-card p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Worth checking:</strong> {recommendation.missingInformation}</p>
                  )}

                  {recommendation.alternatives.length > 0 && (
                    <div className="mt-4 text-xs leading-5 text-muted-foreground">
                      <p className="font-bold text-foreground">You could also consider</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {recommendation.alternatives.map((alternative) => {
                          const alternativeTool = bySlug[alternative.slug];
                          return alternativeTool ? (
                            <Link key={alternative.slug} to="/$slug" params={{ slug: alternative.slug }} title={alternative.reason} className="rounded-lg border border-border bg-card px-3 py-2 font-bold text-primary hover:border-primary">
                              {alternativeTool.name}
                            </Link>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  <p className="mt-4 text-[11px] leading-5 text-muted-foreground">AI can make mistakes. Check the suggested values and the tool’s own formula before relying on a result.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
