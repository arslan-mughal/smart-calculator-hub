// Meta-tag HTML generation for the Meta Tag Generator (the tool that
// CREATES tags — the Meta Tag Analyzer checks existing ones). Pure
// function, so it is unit-testable and reusable by the component.

export type MetaTagFields = {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  author: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
};

function attr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Build the <head> markup for the fields that are filled in. */
export function buildMetaTags(f: MetaTagFields): string {
  const lines: string[] = [];
  if (f.title.trim()) lines.push(`<title>${attr(f.title.trim())}</title>`);
  if (f.description.trim())
    lines.push(`<meta name="description" content="${attr(f.description.trim())}">`);
  if (f.keywords.trim())
    lines.push(`<meta name="keywords" content="${attr(f.keywords.trim())}">`);
  if (f.author.trim()) lines.push(`<meta name="author" content="${attr(f.author.trim())}">`);
  if (f.robots.trim()) lines.push(`<meta name="robots" content="${attr(f.robots.trim())}">`);
  if (f.canonical.trim())
    lines.push(`<link rel="canonical" href="${attr(f.canonical.trim())}">`);
  const ogTitle = (f.ogTitle || f.title).trim();
  const ogDescription = (f.ogDescription || f.description).trim();
  if (ogTitle) lines.push(`<meta property="og:title" content="${attr(ogTitle)}">`);
  if (ogDescription)
    lines.push(`<meta property="og:description" content="${attr(ogDescription)}">`);
  if (f.ogType.trim()) lines.push(`<meta property="og:type" content="${attr(f.ogType.trim())}">`);
  if (f.ogUrl.trim()) lines.push(`<meta property="og:url" content="${attr(f.ogUrl.trim())}">`);
  if (f.ogImage.trim())
    lines.push(`<meta property="og:image" content="${attr(f.ogImage.trim())}">`);
  const twCard = f.twitterCard.trim();
  if (twCard) lines.push(`<meta name="twitter:card" content="${attr(twCard)}">`);
  const twTitle = (f.twitterTitle || f.ogTitle || f.title).trim();
  const twDescription = (f.twitterDescription || f.ogDescription || f.description).trim();
  if (twTitle && twCard)
    lines.push(`<meta name="twitter:title" content="${attr(twTitle)}">`);
  if (twDescription && twCard)
    lines.push(`<meta name="twitter:description" content="${attr(twDescription)}">`);
  if (f.twitterImage.trim() && twCard)
    lines.push(`<meta name="twitter:image" content="${attr(f.twitterImage.trim())}">`);
  return lines.join("\n");
}
