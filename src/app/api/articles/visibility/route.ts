import { NextResponse } from "next/server";
import { hideStaticArticle } from "@/lib/article-visibility";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json(
        { error: "id を指定してください。" },
        { status: 400 },
      );
    }

    return NextResponse.json(await hideStaticArticle(body.id));
  } catch {
    return NextResponse.json(
      { error: "記事の表示設定更新に失敗しました。" },
      { status: 400 },
    );
  }
}
