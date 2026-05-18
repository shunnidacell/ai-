export type XPost = {
  author: string;
  handle: string;
  body: string;
  time: string;
  url: string;
  likes: string;
  reposts: string;
  newsValue: string;
};

export type OfficialPost = {
  account: string;
  handle: string;
  body: string;
  time: string;
  accent: string;
  url: string;
};

export type Reaction = {
  handle: string;
  quote: string;
  stance: string;
};

export type Article = {
  id: string;
  title: string;
  source: string;
  date: string;
  category: string;
  image: string;
  imagePrompt: string;
  imageSource: string;
  excerpt: string;
  body: string[];
  views: string;
  featuredPost: XPost;
  relatedPosts: XPost[];
  reactions: Reaction[];
};

export type Trend = {
  tag: string;
  posts: string;
  tone: "blue" | "violet" | "cyan";
};

export const officialPosts: OfficialPost[] = [
  {
    account: "Anthropic",
    handle: "@AnthropicAI",
    body: "Claude Opus 4.6のシステムカード公開を案内。",
    time: "2026年5月",
    accent: "anthropic",
    url: "https://x.com/AnthropicAI/status/2021397952791707696",
  },
  {
    account: "Anthropic",
    handle: "@AnthropicAI",
    body: "モデル蒸留攻撃と防御手法に関する研究を公開。",
    time: "2026年5月",
    accent: "anthropic",
    url: "https://x.com/AnthropicAI/status/2025997928242811253",
  },
  {
    account: "Google AI",
    handle: "@GoogleAI",
    body: "Lyria 3 ProをGoogle AI Pro/Ultra向けに展開。",
    time: "2026年5月",
    accent: "google",
    url: "https://x.com/GoogleAI/status/2036836242076188816",
  },
  {
    account: "Perplexity",
    handle: "@perplexity_ai",
    body: "BlueMatrixとの提携を発表。",
    time: "2026年5月",
    accent: "perplexity",
    url: "https://x.com/perplexity_ai/status/2011484983391559697",
  },
];

export const latestArticles: Article[] = [
  {
    id: "anthropic-opus-46-system-card",
    title: "Anthropic、Claude Opus 4.6のシステムカードを公開",
    source: "Anthropic",
    date: "2026年5月",
    category: "安全性",
    image: "/article-anthropic-opus-46.png",
    imagePrompt:
      "Generated from the source post text: future frontier models, AI Safety Level 4 threshold, sabotage risk reports, Claude Opus 4.6 commitment, dark editorial hero image, no text.",
    imageSource: "元ポスト本文からAI生成",
    excerpt:
      "Claude Opus 4.6の安全性評価や運用上の注意点を確認できる一次情報です。",
    body: [
      "Anthropicは公式Xで、Claude Opus 4.6のシステムカード公開を告知しました。",
      "システムカードは、モデルの安全性評価、リスク管理、利用制限を確認するための重要な一次情報です。企業や開発者は、性能だけでなく導入時の安全性や利用条件を見る必要があります。",
      "この記事では、公式ポストを起点に、導入前に確認すべきポイントを整理します。",
    ],
    views: "編集部注目",
    featuredPost: {
      author: "Anthropic",
      handle: "@AnthropicAI",
      body: "Claude Opus 4.6のシステムカード公開とASL-3 Standardへの移行を案内。",
      time: "2026年5月",
      url: "https://x.com/AnthropicAI/status/2021397952791707696",
      likes: "Xで確認",
      reposts: "Xで確認",
      newsValue: "公式発表",
    },
    relatedPosts: [
      {
        author: "Anthropic",
        handle: "@AnthropicAI",
        body: "Claude Opus 4.1を有料ユーザーやClaude Code、API向けに提供。",
        time: "2026年",
        url: "https://x.com/AnthropicAI/status/1952768437559644644",
        likes: "Xで確認",
        reposts: "Xで確認",
        newsValue: "モデル提供",
      },
    ],
    reactions: [],
  },
  {
    id: "anthropic-model-distillation",
    title: "Anthropic、モデル蒸留攻撃と防御手法の研究を公開",
    source: "Anthropic",
    date: "2026年5月",
    category: "研究",
    image: "/article-model-distillation.png",
    imagePrompt:
      "Generated from the source post text: industrial-scale distillation attacks, fraudulent accounts, millions of Claude exchanges, model extraction defense, dark editorial hero image, no text.",
    imageSource: "元ポスト本文からAI生成",
    excerpt:
      "商用AIモデルの保護とAPI運用に関わるセキュリティ研究です。",
    body: [
      "Anthropicは公式Xで、モデル蒸留攻撃と防御手法に関する研究を公開したと告知しました。",
      "モデル蒸留攻撃は、対象モデルの出力を利用して似た振る舞いをする別モデルを作るリスクにつながります。商用モデルの保護や安全なAPI運用に関わる重要なテーマです。",
      "AI事業者やAPI提供者にとって、モデル保護と利用制限の設計がより重要になります。",
    ],
    views: "編集部注目",
    featuredPost: {
      author: "Anthropic",
      handle: "@AnthropicAI",
      body: "モデル蒸留攻撃と、その対策技術に関する研究を公開。",
      time: "2026年5月",
      url: "https://x.com/AnthropicAI/status/2025997928242811253",
      likes: "Xで確認",
      reposts: "Xで確認",
      newsValue: "研究発表",
    },
    relatedPosts: [
      {
        author: "Anthropic",
        handle: "@AnthropicAI",
        body: "Claude Max、Team、Enterpriseユーザー向けの製品連携を案内。",
        time: "2026年",
        url: "https://x.com/AnthropicAI/status/1949908055526621302",
        likes: "Xで確認",
        reposts: "Xで確認",
        newsValue: "製品更新",
      },
    ],
    reactions: [],
  },
  {
    id: "google-ai-lyria-3-pro",
    title: "Google AI、Lyria 3 ProをAI Pro/Ultra向けに展開",
    source: "Google AI",
    date: "2026年5月",
    category: "生成AI",
    image: "/article-google-lyria-3-pro.png",
    imagePrompt:
      "Generated from the source post text: Lyria 3 Pro, studio access, Gemini app, Google AI Studio, Gemini API, Vertex AI, Google Vids, dark editorial hero image, no text.",
    imageSource: "元ポスト本文からAI生成",
    excerpt:
      "生成AIの活用領域が音楽制作にも広がっていることを示す更新です。",
    body: [
      "Google AIは公式Xで、Lyria 3 ProがGoogle AI ProとUltraで利用可能になったと案内しました。",
      "Lyriaは音楽生成に関わるGoogleのAI技術です。生成AIの対象がテキストや画像だけでなく、音楽制作にも広がっていることを示す動きです。",
      "クリエイター向けAIの拡大と、商用利用時の権利確認が今後の論点になります。",
    ],
    views: "編集部注目",
    featuredPost: {
      author: "Google AI",
      handle: "@GoogleAI",
      body: "Lyria 3 ProがGoogle AI Pro/Ultraで利用可能に。",
      time: "2026年5月",
      url: "https://x.com/GoogleAI/status/2036836242076188816",
      likes: "Xで確認",
      reposts: "Xで確認",
      newsValue: "提供開始",
    },
    relatedPosts: [
      {
        author: "Perplexity",
        handle: "@perplexity_ai",
        body: "BlueMatrixとの提携を発表。",
        time: "2026年",
        url: "https://x.com/perplexity_ai/status/2011484983391559697",
        likes: "Xで確認",
        reposts: "Xで確認",
        newsValue: "提携発表",
      },
    ],
    reactions: [],
  },
  {
    id: "perplexity-bluematrix",
    title: "Perplexity、BlueMatrixとの提携を発表",
    source: "Perplexity",
    date: "2026年5月",
    category: "AI検索",
    image: "/article-perplexity-bluematrix.png",
    imagePrompt:
      "Generated from the source post text: BlueMatrix partnership, equity research, Perplexity Enterprise, buy-side professionals, real-time financial data, dark editorial hero image, no text.",
    imageSource: "元ポスト本文からAI生成",
    excerpt:
      "AI検索・調査領域での企業連携として注目されるニュースです。",
    body: [
      "Perplexityは公式Xで、BlueMatrixとの提携を発表しました。",
      "AI検索や調査支援の領域では、企業向けデータやワークフロー連携が重要になっています。",
      "今回の提携がどの機能や利用者層に影響するか、公式情報をもとに確認する必要があります。",
    ],
    views: "編集部注目",
    featuredPost: {
      author: "Perplexity",
      handle: "@perplexity_ai",
      body: "BlueMatrixとの提携を公式Xで発表。",
      time: "2026年5月",
      url: "https://x.com/perplexity_ai/status/2011484983391559697",
      likes: "Xで確認",
      reposts: "Xで確認",
      newsValue: "提携発表",
    },
    relatedPosts: [],
    reactions: [],
  },
];

export const trends: Trend[] = [
  { tag: "Claude Opus 4.6", posts: "公式発表から掲載", tone: "violet" },
  { tag: "モデル蒸留攻撃", posts: "研究発表から掲載", tone: "blue" },
  { tag: "Lyria 3 Pro", posts: "提供開始から掲載", tone: "cyan" },
  { tag: "Perplexity提携", posts: "公式発表から掲載", tone: "blue" },
  { tag: "Notion連携", posts: "候補として確認中", tone: "violet" },
];
