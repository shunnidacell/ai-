"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function CollectWithHermesButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCollect() {
    setBusy(true);
    setMessage("Hermesで候補を探しています...");

    const response = await fetch("/api/hermes/collect", {
      method: "POST",
    });
    const result = await response.json();

    if (!response.ok) {
      setBusy(false);
      setMessage(result.error ?? "収集に失敗しました。");
      return;
    }

    setMessage(`${result.urls?.length ?? 0}件のURLを検出しました。`);
    window.location.reload();
  }

  return (
    <div className="hermesCollectBox">
      <button
        className="hermesCollectButton"
        disabled={busy}
        onClick={handleCollect}
        type="button"
      >
        <Sparkles size={16} />
        {busy ? "Hermes収集中" : "Hermesで候補収集"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
