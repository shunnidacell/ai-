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
    body: "Claude Opus 4.6のシステムカードを公開。ASL-3 Standardへの移行も告知。",
    time: "2026年5月",
    accent: "anthropic",
    url: "https://x.com/AnthropicAI/status/2021397952791707696",
  },
  {
    account: "Anthropic",
    handle: "@AnthropicAI",
    body: "モデル蒸留攻撃と、その対策技術についての研究を公開。",
    time: "2026年5月",
    accent: "anthropic",
    url: "https://x.com/AnthropicAI/status/2025997928242811253",
  },
  {
    account: "Google AI",
    handle: "@GoogleAI",
    body: "Lyria 3 ProがGoogle AI Pro/Ultraで利用可能に。",
    time: "2026年5月",
    accent: "google",
    url: "https://x.com/GoogleAI/status/2036836242076188816",
  },
  {
    account: "Claude",
    handle: "@claudeai",
    body: "Routines、API endpoint、text extractionなどの更新を告知。",
    time: "2026年5月",
    accent: "anthropic",
    url: "https://x.com/claudeai/status/2044095089203655099",
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
    image: "/ai-chip-hero.png",
    imagePrompt:
      "Dark editorial hero image about AI safety evaluation and model system cards, no text.",
    excerpt:
      "AnthropicはClaude Opus 4.6のシステムカードを公開し、同モデルをASL-3 Standardへ移行したと説明しています。",
    body: [
      "Anthropicは公式Xで、Claude Opus 4.6のシステムカード公開を告知しました。投稿では、同社がこのモデルをASL-3 Standardに移行したことにも触れています。",
      "システムカードは、モデルの安全性評価、リスク管理、利用時の制約を理解するための重要な一次情報です。AIモデルの性能だけでなく、運用上の安全性を確認する材料になります。",
      "この記事では、公式投稿を起点に、システムカードで確認すべき項目と、開発者・企業が導入前に見るべきポイントを整理します。",
    ],
    views: "X埋め込みで確認",
    featuredPost: {
      author: "Anthropic",
      handle: "@AnthropicAI",
      body: "Claude Opus 4.6のシステムカード公開とASL-3 Standardへの移行を告知。",
      time: "2026年5月",
      url: "https://x.com/AnthropicAI/status/2021397952791707696",
      likes: "X埋め込みで確認",
      reposts: "X埋め込みで確認",
      newsValue: "公式発表",
    },
    relatedPosts: [
      {
        author: "Anthropic",
        handle: "@AnthropicAI",
        body: "Claude Opus 4.1を有料ユーザー、Claude Code、APIなどに提供開始。",
        time: "2026年",
        url: "https://x.com/AnthropicAI/status/1952768437559644644",
        likes: "X埋め込みで確認",
        reposts: "X埋め込みで確認",
        newsValue: "モデル提供開始",
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
    image: "/ai-chip-hero.png",
    imagePrompt:
      "Dark editorial hero image about AI security research and model extraction defense, no text.",
    excerpt:
      "Anthropicは、モデル蒸留攻撃とその防御手法に関する研究を公式Xで紹介しました。",
    body: [
      "Anthropicは公式Xで、モデル蒸留攻撃と、その対策技術に関する研究を公開したと告知しました。",
      "モデル蒸留攻撃は、対象モデルの出力を利用して似た振る舞いをする別モデルを作るリスクにつながります。商用モデルの保護や安全なAPI運用に関わる重要なテーマです。",
      "この記事では、公式投稿と研究内容を起点に、AI事業者やAPI提供者にとっての影響を整理します。",
    ],
    views: "X埋め込みで確認",
    featuredPost: {
      author: "Anthropic",
      handle: "@AnthropicAI",
      body: "モデル蒸留攻撃と、その対策技術に関する研究を公開。",
      time: "2026年5月",
      url: "https://x.com/AnthropicAI/status/2025997928242811253",
      likes: "X埋め込みで確認",
      reposts: "X埋め込みで確認",
      newsValue: "研究発表",
    },
    relatedPosts: [
      {
        author: "Anthropic",
        handle: "@AnthropicAI",
        body: "Claude Max、Team、Enterpriseユーザー向けにNotionとLinear連携を案内。",
        time: "2026年",
        url: "https://x.com/AnthropicAI/status/1949908055526621302",
        likes: "X埋め込みで確認",
        reposts: "X埋め込みで確認",
        newsValue: "製品連携",
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
    image: "/ai-chip-hero.png",
    imagePrompt:
      "Dark editorial hero image about generative music AI and waveform interface, no text.",
    excerpt:
      "Google AIは、Lyria 3 ProがGoogle AI ProとUltraで利用できると公式Xで案内しました。",
    body: [
      "Google AIは公式Xで、Lyria 3 ProをGoogle AI ProとUltraで利用できると告知しました。",
      "Lyriaは音楽生成に関わるGoogleのAI技術です。生成AIの対象がテキストや画像だけでなく、音楽制作にも広がっていることを示す動きです。",
      "この記事では、公式投稿をもとに、クリエイター向けAIツールとしての意味と、利用時に確認すべき権利面の論点を整理します。",
    ],
    views: "X埋め込みで確認",
    featuredPost: {
      author: "Google AI",
      handle: "@GoogleAI",
      body: "Lyria 3 ProがGoogle AI Pro/Ultraで利用可能に。",
      time: "2026年5月",
      url: "https://x.com/GoogleAI/status/2036836242076188816",
      likes: "X埋め込みで確認",
      reposts: "X埋め込みで確認",
      newsValue: "提供開始",
    },
    relatedPosts: [
      {
        author: "Perplexity",
        handle: "@perplexity_ai",
        body: "BlueMatrixとの提携を発表。",
        time: "2026年",
        url: "https://x.com/perplexity_ai/status/2011484983391559697",
        likes: "X埋め込みで確認",
        reposts: "X埋め込みで確認",
        newsValue: "提携発表",
      },
    ],
    reactions: [],
  },
];

export const trends: Trend[] = [
  { tag: "Claude Opus 4.6", posts: "公式投稿を確認", tone: "violet" },
  { tag: "モデル蒸留攻撃", posts: "研究発表", tone: "blue" },
  { tag: "Lyria 3 Pro", posts: "提供開始", tone: "cyan" },
  { tag: "Notion連携", posts: "製品更新", tone: "violet" },
  { tag: "Perplexity提携", posts: "提携発表", tone: "blue" },
];
