"use client";

import { useState } from "react";
import type { CandidateDecision } from "@/lib/x-candidates";

const reviewActions: Array<{ decision: CandidateDecision; label: string }> = [
  { decision: "rejected", label: "公開しない" },
  { decision: "published", label: "公開する" },
  { decision: "headline", label: "見出しにする" },
];

const publicActions: Array<{ decision: CandidateDecision; label: string }> = [
  { decision: "draft", label: "非公開に戻す" },
  { decision: "published", label: "公開記事" },
  { decision: "headline", label: "見出しにする" },
];

export function CandidateDecisionButtons({
  allowHeadline,
  current,
  id,
  mode = "review",
}: {
  allowHeadline: boolean;
  current?: CandidateDecision;
  id: string;
  mode?: "review" | "public";
}) {
  const [busy, setBusy] = useState<CandidateDecision | null>(null);
  const [localCurrent, setLocalCurrent] = useState(current);
  const [message, setMessage] = useState("");
  const actions = mode === "public" ? publicActions : reviewActions;

  async function update(decision: CandidateDecision) {
    setBusy(decision);
    setMessage("");
    const response = await fetch("/api/x-candidates", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });

    if (response.ok) {
      setLocalCurrent(decision);
      setMessage("更新しました。ページ更新後に一覧へ反映されます。");
    } else {
      const result = await response.json().catch(() => ({}));
      setMessage(result.error ?? "更新に失敗しました。");
    }

    setBusy(null);
  }

  return (
    <div className="decisionButtonGroup">
      <div className="decisionButtons">
        {actions.map((action) => {
          const headlineBlocked =
            action.decision === "headline" && !allowHeadline;

          return (
            <button
              className={localCurrent === action.decision ? "activeDecision" : ""}
              disabled={Boolean(busy) || headlineBlocked}
              key={action.decision}
              onClick={() => update(action.decision)}
              title={
                headlineBlocked
                  ? "見出しは大きなニュースや一次情報だけに使います。"
                  : undefined
              }
              type="button"
            >
              {busy === action.decision ? "更新中" : action.label}
            </button>
          );
        })}
      </div>
      {message && <p className="decisionMessage">{message}</p>}
    </div>
  );
}
