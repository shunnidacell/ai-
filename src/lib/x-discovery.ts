export type XDiscoveryQuery = {
  label: string;
  query: string;
  minLikes: number;
  reason: string;
};

export const xDiscoveryQueries: XDiscoveryQuery[] = [
  {
    label: "公式AI発表",
    query:
      '(from:OpenAI OR from:AnthropicAI OR from:GoogleAI OR from:xai OR from:MetaAI) (launch OR release OR API OR model OR update)',
    minLikes: 1000,
    reason: "公式アカウントの新機能、モデル、API更新だけを候補にする",
  },
  {
    label: "開発者向け更新",
    query:
      '(from:OpenAIDevs OR from:AnthropicAI OR from:GoogleAI) (docs OR developers OR API OR SDK OR pricing)',
    minLikes: 500,
    reason: "開発者向けの仕様変更やドキュメント更新を拾う",
  },
  {
    label: "高反応のAIニュース",
    query:
      '(AI OR LLM OR Gemini OR Claude OR ChatGPT OR Grok) (announced OR released OR launches) min_faves:1000',
    minLikes: 1000,
    reason: "ニュース化できる反応量のある投稿だけを候補にする",
  },
];

export function buildXSearchUrl(query: string) {
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
}
