"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { CandidateDraft } from "@/lib/x-candidates";

export function CandidateEditForm({
  draft,
  id,
  postImageUrl,
  postText,
}: {
  draft: CandidateDraft;
  id: string;
  image: string;
  postImageUrl?: string;
  postText?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    await fetch("/api/x-candidates", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        draft: {
          body: String(formData.get("body") ?? ""),
          imageOverride: String(formData.get("imageOverride") ?? ""),
          imagePrompt: String(formData.get("imagePrompt") ?? ""),
          postImageUrl: String(formData.get("postImageUrl") ?? ""),
          postText: String(formData.get("postText") ?? ""),
          summary: String(formData.get("summary") ?? ""),
          title: String(formData.get("title") ?? ""),
          translation: String(formData.get("translation") ?? ""),
        },
        id,
      }),
    });
    window.location.reload();
  }

  return (
    <form className="candidateEditForm" onSubmit={save}>
      <label>
        タイトル
        <input defaultValue={draft.title} name="title" />
      </label>
      <label>
        タイトル画像URL
        <input name="imageOverride" placeholder="必要になったら入力" />
      </label>
      <label>
        Xポスト画像URL
        <input defaultValue={postImageUrl ?? ""} name="postImageUrl" />
      </label>
      <label>
        Xポスト本文
        <textarea defaultValue={postText ?? ""} name="postText" rows={4} />
      </label>
      <label>
        要約
        <textarea defaultValue={draft.summary} name="summary" rows={3} />
      </label>
      <label>
        翻訳・内容メモ
        <textarea defaultValue={draft.translation} name="translation" rows={4} />
      </label>
      <label>
        本文
        <textarea defaultValue={draft.body.join("\n\n")} name="body" rows={7} />
      </label>
      <label>
        画像生成プロンプト
        <textarea defaultValue={draft.imagePrompt} name="imagePrompt" rows={3} />
      </label>
      <button disabled={busy} type="submit">
        {busy ? "保存中" : "編集内容を保存"}
      </button>
    </form>
  );
}
