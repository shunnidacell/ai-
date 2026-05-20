import { NextResponse } from "next/server";
import {
  hideStaticArticle,
  purgeStaticArticle,
  restoreStaticArticle,
} from "@/lib/article-visibility";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "delete" | "hide" | "purge" | "restore";
      id?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "id を指定してください。" },
        { status: 400 },
      );
    }

    if (body.action === "restore") {
      return NextResponse.json(await restoreStaticArticle(body.id));
    }

    if (body.action === "purge") {
      return NextResponse.json(await purgeStaticArticle(body.id));
    }

    return NextResponse.json(
      await hideStaticArticle(body.id, body.action === "delete" ? "deleted" : "hidden"),
    );
  } catch {
    return NextResponse.json(
      { error: "記事の表示設定更新に失敗しました。" },
      { status: 400 },
    );
  }
}
