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
  const text =
    candidate.postText?.trim() ||
    draft.translation ||
    draft.summary ||
    `${candidate.author} のXポストから作成したAIニュースです。`;
  const svg = renderPostCardSvg({
    author: candidate.author,
    handle: `@${candidate.author}`,
    text,
    title: draft.title,
  });

  return new Response(svg, {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=300",
      "content-type": "image/svg+xml; charset=utf-8",
    },
  });
}

function renderPostCardSvg({
  author,
  handle,
  text,
  title,
}: {
  author: string;
  handle: string;
  text: string;
  title: string;
}) {
  const bodyLines = wrapText(text, 44).slice(0, 5);
  const titleLines = wrapText(title, 24).slice(0, 2);
  const initials = author.slice(0, 1).toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f9fbff"/>
      <stop offset="0.55" stop-color="#eef6ff"/>
      <stop offset="1" stop-color="#f5efff"/>
    </linearGradient>
    <linearGradient id="avatar" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#7dd3fc"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#51617f" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="1040" cy="116" r="140" fill="#dbeafe" opacity="0.52"/>
  <circle cx="165" cy="590" r="220" fill="#ede9fe" opacity="0.58"/>
  <path d="M0 560 C220 488 326 654 546 574 C747 500 837 454 1200 526 L1200 675 L0 675 Z" fill="#ffffff" opacity="0.58"/>
  <g filter="url(#shadow)">
    <rect x="92" y="76" width="1016" height="502" rx="34" fill="#ffffff" stroke="#dbe4f2" stroke-width="2"/>
    <g transform="translate(140 124)">
      <circle cx="45" cy="45" r="45" fill="url(#avatar)"/>
      <text x="45" y="58" text-anchor="middle" font-size="42" font-family="Arial, sans-serif" font-weight="800" fill="#ffffff">${escapeXml(initials)}</text>
      <text x="112" y="35" font-size="34" font-family="Arial, 'Noto Sans JP', sans-serif" font-weight="800" fill="#0f172a">${escapeXml(author)}</text>
      <circle cx="326" cy="25" r="13" fill="#1d9bf0"/>
      <path d="M320 25 l5 6 l11 -14" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="112" y="72" font-size="24" font-family="Arial, sans-serif" fill="#64748b">${escapeXml(handle)} · X post</text>
    </g>
    <g transform="translate(140 238)">
      ${bodyLines
        .map(
          (line, index) =>
            `<text x="0" y="${index * 42}" font-size="30" font-family="Arial, 'Noto Sans JP', sans-serif" fill="#111827">${escapeXml(line)}</text>`,
        )
        .join("")}
    </g>
    <g transform="translate(140 470)">
      <rect x="0" y="-34" width="920" height="92" rx="22" fill="#f8fbff" stroke="#d9e5f6"/>
      ${titleLines
        .map(
          (line, index) =>
            `<text x="28" y="${index * 34 + 4}" font-size="26" font-family="Arial, 'Noto Sans JP', sans-serif" font-weight="800" fill="#10204a">${escapeXml(line)}</text>`,
        )
        .join("")}
    </g>
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
