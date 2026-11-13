import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy | CalcHub" },
    { name: "description", content: "How CalcHub handles calculator entries, uploaded images and other information while you use the free online tools." },
    { property: "og:title", content: "CalcHub Privacy Policy" }, { property: "og:description", content: "Browser-based tools designed around your privacy." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Privacy,
});

function Privacy() {
  return <div className="mx-auto max-w-3xl px-5 py-14"><span className="inline-flex rounded-2xl bg-secondary p-3 text-primary"><ShieldCheck className="size-7"/></span><p className="section-kicker mt-5">Your data</p><h1 className="mt-3 font-display text-4xl font-extrabold">Privacy policy</h1><p className="mt-4 text-muted-foreground">Last updated: 12 November 2026</p><article className="prose-calc mt-8"><h2>Calculator and tool entries</h2><p>CalcHub's calculations, text transformations, random generators and formatting tools run in your browser. The values you type are not sent to a CalcHub database and are not saved by the application. Clearing or refreshing the page removes the current entries.</p><h2>Images and generated files</h2><p>The image resizer reads your selected file locally and creates the resized download in your browser. The QR code generator also runs locally. CalcHub does not upload these files to a server. Temporary browser object URLs are released when they are replaced or the page closes.</p><h2>Hosting and technical logs</h2><p>Like most websites, the hosting provider may process standard technical information needed to deliver and protect the site, such as an IP address, browser type, requested page and timestamp. CalcHub's tool code does not include your calculator entries in page addresses.</p><h2>External resources</h2><p>The site loads its typefaces from Google Fonts. Your browser connects to that provider to retrieve the font files, which may reveal standard request information to them. Generated images and QR downloads do not use an external service.</p><h2>Your choices</h2><p>You can use the tools without creating an account or providing a name or email address. Do not enter sensitive information into examples or shared screenshots. You may clear site data through your browser settings at any time.</p></article></div>;
}
