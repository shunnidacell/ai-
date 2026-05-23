import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { MessageSquareQuote, Sparkles } from "lucide-react";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { CandidateEditForm } from "@/components/candidate-edit-form";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { SiteHeader } from "@/components/site-header";
import { StaticArticleAdminButtons } from "@/components/static-article-admin-buttons";
import { StaticArticleEditForm } from "@/components/static-article-edit-form";
import { XPostCard } from "@/components/x-post-card";
import { getStaticArticleById } from "@/lib/article-visibility";
import {
  buildCandidateDraft,
  getCandidateImage,
  readCandidates,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function PublishedArticleAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staticArticle = await getStaticArticleById(id);

  if (staticArticle) {
    return (
      <main
        className="siteShell fixedBackdropShell articleBackdropShell"
        style={{ "--page-bg": `url(${staticArticle.image})` } as CSSProperties}
      >
        <SiteHeader admin />
        <article className="articleLayout">
          <section className="articleHero">
            <div
              aria-hidden="true"
              className="articleHeroFixedBg"
              style={{ backgroundImage: `url(${staticArticle.image})` }}
            />
            <div className="articleHeroOverlay" />
            <div className="articleHeroText">
              <span className="badge">{staticArticle.category}</span>
              <p>
                {staticArticle.source} / {staticArticle.date}
              </p>
              <p className="imageCredit">{staticArticle.imageSource}</p>
              <h1>{staticArticle.title}</h1>
            </div>
          </section>

          <div className="articleBodyGrid">
            <div className="articleBody">
              <div className="publishedArticleAdminBar">
                <strong>固定記事の管理</strong>
                <StaticArticleAdminButtons id={staticArticle.id} />
              </div>
              <StaticArticleEditForm article={staticArticle} />
              <div className="generatedNotice">
                <Sparkles size={16} />
                公開ページのコピー編集画面です。日付: {staticArticle.date}
              </div>

              <section className="embeddedPostBlock">
                <h2>参考にしたXポスト</h2>
                <XPostCard post={staticArticle.featuredPost} />
              </section>

              {staticArticle.body.map((paragraph) =>
                paragraph.startsWith("### ") ? (
                  <h2 key={paragraph}>{paragraph.replace(/^###\s+/, "")}</h2>
                ) : (
                  <p key={paragraph}>{paragraph}</p>
                ),
              )}
            </div>

            <aside className="reactionPanel">
              <h2>
                <MessageSquareQuote size={18} />
                編集メモ
              </h2>
              <div className="reactionStack">
                <blockquote>
                  <span>日付</span>
                  <p>{staticArticle.date}</p>
                  <cite>AI Insight JP</cite>
                </blockquote>
              </div>
            </aside>
          </div>
        </article>
      </main>
    );
  }

  const candidates = await readCandidates();
  const candidate = candidates.find((item) => item.id === id && !item.deletedAt);

  if (!candidate) {
    notFound();
  }

  const draft = buildCandidateDraft(candidate);
  const image = getCandidateImage(candidate);
  const date = formatCandidateDate(candidate.decidedAt ?? candidate.createdAt);
  const allowHeadline =
    candidate.sourceType === "official" || candidate.sourceType === "developer";

  return (
    <main
      className="siteShell fixedBackdropShell articleBackdropShell"
      style={{ "--page-bg": `url(${image})` } as CSSProperties}
    >
      <SiteHeader admin />

      <article className="articleLayout">
        <section className="articleHero">
          <div
            aria-hidden="true"
            className="articleHeroFixedBg"
            style={{ backgroundImage: `url(${image})` }}
          />
          <div className="articleHeroOverlay" />
          <div className="articleHeroText">
            <span className="badge">
              {candidate.decision === "headline" ? "見出し" : "公開記事"}
            </span>
            <p>
              {candidate.author} / {date}
            </p>
            <h1>{draft.title}</h1>
          </div>
        </section>

        <div className="articleBodyGrid">
          <div className="articleBody">
            <div className="publishedArticleAdminBar">
              <strong>記事編集</strong>
              <CandidateDecisionButtons
                allowHeadline={allowHeadline}
                current={candidate.decision}
                id={candidate.id}
                mode="public"
              />
              <DeleteCandidateButton id={candidate.id} />
            </div>

            <CandidateEditForm
              draft={draft}
              id={candidate.id}
              image={image}
              postImageUrl={candidate.postImageUrl}
              postText={candidate.postText}
            />

            <div className="generatedNotice">
              <Sparkles size={16} />
              公開ページのコピー編集画面です。日付: {date}
            </div>

            <section className="embeddedPostBlock">
              <h2>参考にしたXポスト</h2>
              <XPostCard
                post={{
                  author: candidate.author,
                  body: draft.translation,
                  handle: candidate.author,
                  likes: "-",
                  newsValue: "Xポスト",
                  reposts: "-",
                  time: date,
                  url: candidate.url,
                }}
              />
            </section>

            <p>{draft.summary}</p>
            {draft.body.map((paragraph) =>
              paragraph.startsWith("### ") ? (
                <h2 key={paragraph}>{paragraph.replace(/^###\s+/, "")}</h2>
              ) : (
                <p key={paragraph}>{paragraph}</p>
              ),
            )}
          </div>

          <aside className="reactionPanel">
            <h2>
              <MessageSquareQuote size={18} />
              編集メモ
            </h2>
            <div className="reactionStack">
              <blockquote>
                <span>公開日</span>
                <p>{date}</p>
                <cite>{candidate.url}</cite>
              </blockquote>
              <blockquote>
                <span>戻る</span>
                <p>
                  <Link href="/published">公開済み記事管理に戻る</Link>
                </p>
                <cite>AI Insight JP Admin</cite>
              </blockquote>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}

function formatCandidateDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
