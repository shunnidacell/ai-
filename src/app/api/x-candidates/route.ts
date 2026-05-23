import { NextResponse } from "next/server";
import {
  type CandidateDecision,
  deleteCandidate,
  purgeCandidate,
  readCandidates,
  registerCandidate,
  restoreCandidate,
  updateCandidateDecision,
  updateCandidateDraft,
} from "@/lib/x-candidates";

export async function GET() {
  return NextResponse.json({
    candidates: await readCandidates(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      postImageUrl?: string;
      postText?: string;
      url?: string;
      urls?: string[];
    };
    const urls = body.urls ?? (body.url ? [body.url] : []);

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "url または urls を指定してください。" },
        { status: 400 },
      );
    }

    const results = [];

    for (const url of urls) {
      results.push(
        await registerCandidate(url, {
          postImageUrl: body.postImageUrl,
          postText: body.postText,
        }),
      );
    }

    return NextResponse.json({
      registered: results,
      candidates: await readCandidates(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "候補登録に失敗しました。",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "delete" | "purge" | "restore";
      id?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "id を指定してください。" },
        { status: 400 },
      );
    }

    if (body.action === "restore") {
      return NextResponse.json(await restoreCandidate(body.id));
    }

    if (body.action === "purge") {
      return NextResponse.json(await purgeCandidate(body.id));
    }

    return NextResponse.json(await deleteCandidate(body.id));
  } catch {
    return NextResponse.json(
      { error: "候補削除に失敗しました。" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      decision?: CandidateDecision;
      draft?: {
        body?: string;
        imageOverride?: string;
        imagePrompt?: string;
        postImageUrl?: string;
        postText?: string;
        summary?: string;
        title?: string;
        translation?: string;
      };
      id?: string;
    };

    if (!body.id || (!body.decision && !body.draft)) {
      return NextResponse.json(
        { error: "id と更新内容を指定してください。" },
        { status: 400 },
      );
    }

    if (
      body.decision &&
      !["draft", "published", "headline", "rejected"].includes(body.decision)
    ) {
      return NextResponse.json(
        { error: "decision が不正です。" },
        { status: 400 },
      );
    }

    const candidates = await readCandidates();
    const candidate = candidates.find((item) => item.id === body.id);

    if (!candidate) {
      return NextResponse.json(
        { error: "候補が見つかりません。" },
        { status: 404 },
      );
    }

    if (body.draft) {
      return NextResponse.json(await updateCandidateDraft(body.id, body.draft));
    }

    if (!body.decision) {
      return NextResponse.json(
        { error: "decision を指定してください。" },
        { status: 400 },
      );
    }

    if (
      body.decision === "headline" &&
      candidate.sourceType !== "official" &&
      candidate.sourceType !== "developer"
    ) {
      return NextResponse.json(
        { error: "見出しは大きなニュースや一次情報だけに使います。" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await updateCandidateDecision(body.id, body.decision),
    );
  } catch {
    return NextResponse.json(
      { error: "候補の状態更新に失敗しました。" },
      { status: 400 },
    );
  }
}
