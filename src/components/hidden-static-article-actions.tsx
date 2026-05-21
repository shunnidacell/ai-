"use client";

import { useState } from "react";

export function HiddenStaticArticleActions({ id }: { id: string }) {
  const [busy, setBusy] = useState<"delete" | "restore" | null>(null);

  async function run(action: "delete" | "restore") {
    setBusy(action);
    await fetch("/api/articles/visibility", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    window.location.reload();
  }

  return (
    <div className="staticArticleAdminButtons">
      <button disabled={Boolean(busy)} onClick={() => run("restore")} type="button">
        {busy === "restore" ? "公開中" : "公開する"}
      </button>
      <button disabled={Boolean(busy)} onClick={() => run("delete")} type="button">
        {busy === "delete" ? "削除中" : "削除"}
      </button>
    </div>
  );
}
