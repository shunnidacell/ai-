"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function BookmarkIntakeForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawUrls = String(formData.get("urls") ?? "");
    const urls = rawUrls
      .split(/\s+/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setMessage("XポストURLを1つ以上貼ってください。");
      return;
    }

    setBusy(true);
    setMessage("");

    const response = await fetch("/api/x-candidates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        postText: String(formData.get("postText") ?? ""),
        urls,
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      registered?: unknown[];
    };

    if (!response.ok) {
      setBusy(false);
      setMessage(result.error ?? "登録に失敗しました。");
      return;
    }

    setMessage(`${result.registered?.length ?? urls.length}件を候補に追加しました。`);
    window.location.reload();
  }

  return (
    <form className="bookmarkIntakeForm" onSubmit={submit}>
      <label>
        ブックマークから選んだXポストURL
        <textarea
          name="urls"
          placeholder="https://x.com/user/status/123..."
          rows={4}
        />
      </label>
      <label>
        メモ・ポスト本文
        <textarea
          name="postText"
          placeholder="ポスト本文を控えておきたい場合だけ入力"
          rows={3}
        />
      </label>
      <div className="bookmarkIntakeActions">
        <button disabled={busy} type="submit">
          {busy ? "登録中" : "候補に追加"}
        </button>
        {message && <p>{message}</p>}
      </div>
    </form>
  );
}
