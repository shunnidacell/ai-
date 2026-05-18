"use client";

import { useState } from "react";
import type { CandidateDecision } from "@/lib/x-candidates";

const actions: Array<{ decision: CandidateDecision; label: string }> = [
  { decision: "rejected", label: "公開しない" },
  { decision: "published", label: "公開する" },
  { decision: "headline", label: "見出しにする" },
];

export function CandidateDecisionButtons({
  current,
  id,
}: {
  current?: CandidateDecision;
  id: string;
}) {
  const [busy, setBusy] = useState<CandidateDecision | null>(null);

  async function update(decision: CandidateDecision) {
    setBusy(decision);
    await fetch("/api/x-candidates", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    window.location.reload();
  }

  return (
    <div className="decisionButtons">
      {actions.map((action) => (
        <button
          className={current === action.decision ? "activeDecision" : ""}
          disabled={Boolean(busy)}
          key={action.decision}
          onClick={() => update(action.decision)}
          type="button"
        >
          {busy === action.decision ? "更新中" : action.label}
        </button>
      ))}
    </div>
  );
}
