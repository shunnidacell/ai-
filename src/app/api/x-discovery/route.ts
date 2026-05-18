import { NextResponse } from "next/server";
import { buildXSearchUrl, xDiscoveryQueries } from "@/lib/x-discovery";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    note:
      "APIなしで本物のポストURLを拾う場合は、この検索URLをブラウザ自動操作や手動確認に渡す。数値は画面表示依存なので最終確認が必要。",
    queries: xDiscoveryQueries.map((item) => ({
      ...item,
      searchUrl: buildXSearchUrl(item.query),
    })),
    articleCriteria: [
      "公式アカウント、企業幹部、研究者、開発者公式アカウントの投稿",
      "モデル公開、API変更、価格変更、提携、資金調達、障害、規約変更",
      "いいね数またはリポスト数が基準以上",
      "一次情報リンク、公式ドキュメント、発表ページのいずれかが確認できる",
    ],
  });
}
