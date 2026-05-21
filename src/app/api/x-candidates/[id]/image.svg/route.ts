import { buildCandidateDraft, readCandidates } from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/x-candidates/[id]/image.svg">,
) {
  const { id } = await context.params;
  const candidates = await readCandidates();
  const candidate = candidates.find((item) => item.id === decodeURIComponent(id));

  if (!candidate) {
    return new Response("Not found", { status: 404 });
  }

  const draft = buildCandidateDraft(candidate);
  const svg = renderTitleImageSvg({
    author: candidate.author,
    summary: draft.summary,
    title: draft.title,
  });

  return new Response(svg, {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=300",
      "content-type": "image/svg+xml; charset=utf-8",
    },
  });
}

function renderTitleImageSvg({
  author,
  summary,
  title,
}: {
  author: string;
  summary: string;
  title: string;
}) {
  const titleLines = wrapText(title, 25).slice(0, 3);
  const summaryLines = wrapText(summary, 37).slice(0, 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#eff6ff"/>
      <stop offset="0.48" stop-color="#f7f3ff"/>
      <stop offset="1" stop-color="#eefdfb"/>
    </linearGradient>
    <linearGradient id="chip" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#d8d0ff"/>
      <stop offset="0.52" stop-color="#c8e7ff"/>
      <stop offset="1" stop-color="#f8fbff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#38bdf8"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="30" flood-color="#58657f" flood-opacity="0.18"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="970" cy="148" r="168" fill="#dbeafe" opacity="0.72"/>
  <circle cx="1060" cy="504" r="214" fill="#ede9fe" opacity="0.62"/>
  <circle cx="138" cy="110" r="118" fill="#ccfbf1" opacity="0.44"/>
  <path d="M0 540 C206 486 326 640 538 558 C744 478 910 452 1200 510 L1200 675 L0 675 Z" fill="#ffffff" opacity="0.58"/>

  <g transform="translate(686 110)" filter="url(#softShadow)">
    <rect x="74" y="42" width="320" height="320" rx="74" fill="url(#chip)" transform="rotate(12 234 202)"/>
    <rect x="26" y="108" width="392" height="244" rx="54" fill="#ffffff" opacity="0.72"/>
    <rect x="94" y="86" width="300" height="300" rx="70" fill="url(#chip)" stroke="#ffffff" stroke-width="8"/>
    <text x="244" y="264" text-anchor="middle" font-size="92" font-family="Arial, sans-serif" font-weight="900" fill="#7c6cff">AI</text>
    <path d="M32 424 C132 348 266 486 424 388" fill="none" stroke="#98d9f2" stroke-width="4" opacity="0.72"/>
    <circle cx="74" cy="394" r="18" fill="#8b5cf6" opacity="0.7"/>
    <circle cx="408" cy="378" r="20" fill="#5eead4" opacity="0.8"/>
    <circle cx="374" cy="104" r="17" fill="#a78bfa" opacity="0.72"/>
  </g>

  <g transform="translate(86 92)">
    <rect x="0" y="0" width="156" height="44" rx="22" fill="#eef2ff" stroke="#d6e0ff"/>
    <text x="78" y="29" text-anchor="middle" font-size="19" font-family="Arial, 'Noto Sans JP', sans-serif" font-weight="800" fill="#6d5df7">AIニュース</text>

    <text x="0" y="116" font-size="66" font-family="Georgia, 'Times New Roman', 'Noto Serif JP', serif" font-weight="800" fill="#071946">
      ${titleLines
        .map(
          (line, index) =>
            `<tspan x="0" dy="${index === 0 ? 0 : 78}">${escapeXml(line)}</tspan>`,
        )
        .join("")}
    </text>

    <rect x="0" y="390" width="126" height="7" rx="4" fill="url(#accent)" filter="url(#glow)"/>
    <text x="0" y="444" font-size="25" font-family="Arial, 'Noto Sans JP', sans-serif" font-weight="700" fill="#5f6f91">
      ${summaryLines
        .map(
          (line, index) =>
            `<tspan x="0" dy="${index === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`,
        )
        .join("")}
    </text>
    <text x="0" y="554" font-size="22" font-family="Arial, sans-serif" font-weight="800" fill="#7b88a5">Source: ${escapeXml(author)}</text>
  </g>
</svg>`;
}

function wrapText(input: string, limit: number) {
  const normalized = input.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let current = "";

  for (const char of normalized) {
    const next = current + char;
    if (visualLength(next) > limit && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function visualLength(value: string) {
  return [...value].reduce((total, char) => {
    return total + (char.charCodeAt(0) > 255 ? 2 : 1);
  }, 0);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
