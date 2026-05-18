"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteCandidateButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    await fetch("/api/x-candidates", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    window.location.reload();
  }

  return (
    <button
      className="deleteCandidateButton"
      disabled={busy}
      onClick={handleDelete}
      type="button"
    >
      <Trash2 size={15} />
      {busy ? "削除中" : "削除"}
    </button>
  );
}
