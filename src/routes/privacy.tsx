import { buildHead, breadcrumbLd, rootSettingsFromMatches } from "@/lib/seo";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: ({ matches }) => {
    const settings = rootSettingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
    );
    return buildHead({
      title: `Privacy Policy | ${settings.siteName}`,
      description: `How ${settings.siteName} handles calculator entries, uploaded images and other information while you use the free online tools.`,
      path: '/privacy',
      jsonLd: [
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: 'Privacy', path: '/privacy' },
        ]),
      ],
    });
  },
  component: Privacy,
});

function Privacy() {
  const { settings } = useLoaderData({ from: "__root__" });
  const siteName = settings.siteName;
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <span className="inline-flex rounded-2xl bg-secondary p-3 text-primary">
        <ShieldCheck className="size-7" />
      </span>
      <p className="section-kicker mt-5">Your data</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Privacy policy</h1>
      <p className="mt-4 text-muted-foreground">Last updated: 15 November 2026</p>
      <article className="prose-calc mt-8">
        <h2>Calculator and tool entries</h2>
        <p>
          {siteName}'s calculations, text transformations, random generators and formatting tools run
          in your browser. The values you type are not sent to a {siteName} database and are not saved
          by the application. Clearing or refreshing the page removes the current entries.
        </p>
        <h2>Tool finder</h2>
        <p>
          The tool finder runs entirely in your browser. Your description is matched against
          {siteName}'s own tool catalogue on your device — no data leaves the browser for this
          feature, and nothing is sent to any AI service. Do not include names, account numbers
          or other sensitive personal details in your description.
        </p>
        <h2>Admin dashboard &amp; local usage</h2>
        <p>
          The admin dashboard at /admin is login-protected and shows only the public tool catalogue and usage stored in
          the administrator's own browser (localStorage key calchub-usage-v1, capped at 500 visits). That usage data
          is never sent anywhere and can be cleared from the dashboard at any time.
        </p>
        <h2>Images and generated files</h2>
        <p>
          The image resizer reads your selected file locally and creates the resized download in
          your browser. The QR code generator also runs locally. {siteName} does not upload these files
          to a server. Temporary browser object URLs are released when they are replaced or the page
          closes.
        </p>
        <h2>Hosting and technical logs</h2>
        <p>
          Like most websites, the hosting provider may process standard technical information needed
          to deliver and protect the site, such as an IP address, browser type, requested page and
          timestamp. {siteName}'s tool code does not include your calculator entries in page addresses.
        </p>
        <h2>External resources</h2>
        <p>
          The site loads no external resources: its typefaces (Manrope and IBM Plex Sans) are
          self-hosted with the site. Generated images and QR downloads do not use an external
          service.
        </p>
        <h2>Your choices</h2>
        <p>
          You can use the tools without creating an account or providing a name or email address. Do
          not enter sensitive information into examples or shared screenshots. You may clear site
          data through your browser settings at any time.
        </p>
      </article>
    </div>
  );
}
