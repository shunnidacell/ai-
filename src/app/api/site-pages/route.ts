import { NextResponse } from "next/server";
import { type EditablePageKey, updateSitePage } from "@/lib/site-pages";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      body?: string;
      key?: EditablePageKey;
      linkHref?: string;
      linkText?: string;
      title?: string;
    };

    if (
      (body.key !== "sns" && body.key !== "contact") ||
      !body.title ||
      !body.body ||
      !body.linkHref ||
      !body.linkText
    ) {
      return NextResponse.json(
        { error: "ページ内容が不足しています。" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await updateSitePage(body.key, {
        body: body.body,
        linkHref: body.linkHref,
        linkText: body.linkText,
        title: body.title,
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "ページ保存に失敗しました。" },
      { status: 400 },
    );
  }
}
