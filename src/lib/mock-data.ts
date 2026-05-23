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

export const officialPosts: OfficialPost[] = [];

export const latestArticles: Article[] = [
  {
    id: "bookmark-workflow",
    title: "XブックマークからAIニュースを作る運用に変更",
    source: "AI Insight JP",
    date: "2026年5月",
    category: "運用方針",
    image: "/ai-chip-hero.png",
    imagePrompt:
      "A clean AI newsroom desk with saved social posts becoming article drafts, bright editorial style, no text.",
    imageSource: "タイトルから生成した仮画像",
    excerpt:
      "Xで自分がブックマークした投稿から、記事化したいものだけを選ぶシンプルな運用にします。",
    body: [
      "AIニュースサイトの運用は、最初から完全自動にすると精度管理が難しくなります。そこで、まずはXで自分がブックマークした投稿の中から、記事化したいものを自分で選ぶ形にします。",
      "選んだポストURLを管理画面に登録し、AIがタイトル、要約、本文、画像案を作ります。最後に自分で確認して公開することで、変な情報や古い情報が混ざるリスクを下げられます。",
      "Hermesの自動収集やX検索は削除せず、運用が安定してから使う機能として残します。"
    ],
    views: "準備中",
    featuredPost: {
      author: "AI Insight JP",
      handle: "@ai_insight_jp",
      body: "ブックマークしたXポストから、記事化するものを自分で選ぶ運用へ切り替えます。",
      time: "2026年5月",
      url: "https://x.com",
      likes: "-",
      reposts: "-",
      newsValue: "運用メモ",
    },
    relatedPosts: [],
    reactions: [],
  },
  {
    id: "post-url-intake",
    title: "ポストURL登録から記事候補を作る流れ",
    source: "AI Insight JP",
    date: "2026年5月",
    category: "管理画面",
    image: "/article-model-distillation.png",
    imagePrompt:
      "A simple dashboard where a social post URL becomes an article draft, clean interface, no text.",
    imageSource: "タイトルから生成した仮画像",
    excerpt:
      "管理画面でXポストURLを登録し、本文と画像を編集してから公開する流れを中心にします。",
    body: [
      "最初の管理画面では、ポストURLの登録、記事候補の確認、タイトルや本文の編集、公開または非公開の切り替えだけを扱います。",
      "ポスト本文を自動取得できない場合でも、URLだけ保存して手動で本文を補完できるようにしておくと運用が止まりません。",
      "公開後の記事は一覧と詳細ページに表示し、非公開や削除済みの記事は公開サイトには出さないようにします。"
    ],
    views: "準備中",
    featuredPost: {
      author: "AI Insight JP",
      handle: "@ai_insight_jp",
      body: "XポストURLを登録し、AIが記事候補を作り、人間が確認して公開する流れを作ります。",
      time: "2026年5月",
      url: "https://x.com",
      likes: "-",
      reposts: "-",
      newsValue: "管理画面",
    },
    relatedPosts: [],
    reactions: [],
  },
  {
    id: "article-storage",
    title: "記事データはDB保存を前提にする",
    source: "AI Insight JP",
    date: "2026年5月",
    category: "データ保存",
    image: "/article-perplexity-bluematrix.png",
    imagePrompt:
      "A secure article database with published drafts and archived posts, clean AI editorial style, no text.",
    imageSource: "タイトルから生成した仮画像",
    excerpt:
      "Renderの再起動や再デプロイで記事が消えないように、記事データはDB保存へ寄せます。",
    body: [
      "今後は、公開記事、下書き、非公開、削除済みを状態として管理できるようにします。これにより、公開サイトと管理画面の表示ズレを減らせます。",
      "まずは既存の保存処理を整理し、DBが使える場合はDBへ、使えない場合はローカルJSONへ退避する形にします。",
      "本番運用ではSupabaseやNeonなどのDBに寄せることで、Renderの無料環境でも記事データを安定して扱いやすくなります。"
    ],
    views: "準備中",
    featuredPost: {
      author: "AI Insight JP",
      handle: "@ai_insight_jp",
      body: "記事データはDB保存を前提にして、公開・非公開・削除済みを状態管理します。",
      time: "2026年5月",
      url: "https://x.com",
      likes: "-",
      reposts: "-",
      newsValue: "データ保存",
    },
    relatedPosts: [],
    reactions: [],
  },
];

export const trends: Trend[] = [];
