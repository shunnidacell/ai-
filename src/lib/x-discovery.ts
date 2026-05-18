export type XDiscoveryQuery = {
  label: string;
  query: string;
  minLikes: number;
  reason: string;
};

export const xDiscoveryQueries: XDiscoveryQuery[] = [
  {
    label: "日本語AI Agent実践",
    query:
      '("AIエージェント" OR "AI Agent" OR "エージェント") ("使い方" OR "作ってみた" OR "手順" OR "実装" OR "自動化") lang:ja min_faves:30',
    minLikes: 30,
    reason:
      "公式発表より、読者が真似できるAI Agentの作り方・使い方を優先します。",
  },
  {
    label: "新モデルを試した投稿",
    query:
      '(Claude OR ChatGPT OR GPT OR Gemini OR Grok OR "新モデル") ("試した" OR "使ってみた" OR "比較" OR "検証" OR "すごい") lang:ja min_faves:50',
    minLikes: 50,
    reason:
      "新モデル発表そのものではなく、日本語ユーザーの検証・使い方・比較を候補にします。",
  },
  {
    label: "AI開発ツール活用",
    query:
      '(Claude Code OR Codex OR Cursor OR Cline OR MCP OR Dify OR LangGraph OR n8n) ("使い方" OR "作った" OR "手順" OR "便利" OR "自動化") lang:ja min_faves:30',
    minLikes: 30,
    reason:
      "開発者やAI活用者の実践ポストを拾い、記事化できるノウハウを探します。",
  },
  {
    label: "画像・動画つきAI手順",
    query:
      '("AI" OR "生成AI") ("スクショ" OR "動画" OR "デモ" OR "手順" OR "プロンプト") ("使い方" OR "作ってみた") lang:ja min_faves:30',
    minLikes: 30,
    reason:
      "記事画像や手順解説に使いやすい、視覚素材つきの日本語ポストを優先します。",
  },
  {
    label: "公式一次情報",
    query:
      '(from:OpenAI OR from:AnthropicAI OR from:GoogleAI OR from:xai OR from:MetaAI) (launch OR release OR API OR model OR update) min_faves:1000',
    minLikes: 1000,
    reason:
      "必要なときだけ、一次情報として公式発表を補助的に確認します。",
  },
];

export function buildXSearchUrl(query: string) {
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
}
