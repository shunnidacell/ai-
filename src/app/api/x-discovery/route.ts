import { NextResponse } from "next/server";
import { buildXSearchUrl, xDiscoveryQueries } from "@/lib/x-discovery";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    note:
      "公式発表だけでなく、日本語の実践・解説・検証ポストを優先して探す検索セットです。最終公開は候補管理画面で確認してください。",
    queries: xDiscoveryQueries.map((item) => ({
      ...item,
      searchUrl: buildXSearchUrl(item.query),
    })),
    articleCriteria: [
      "日本語で、読者が真似できる手順や使い方がある",
      "新しいAI Agent、モデル、AIツール、MCP、ワークフローに関係している",
      "スクショ、動画、コード例、スレッドなど、記事化しやすい材料がある",
      "いいね数だけでなく、内容の具体性と独自性を優先する",
      "公式発表は補助ソースとして扱い、主役は実際に試した人の投稿にする",
    ],
  });
}
