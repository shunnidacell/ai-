"use client";

import { useState } from "react";

export function StaticArticleAdminButtons({ id }: { id: string }) {
  const [busy, setBusy] = useState<"hide" | "delete" | null>(null);

  async function hide(kind: "hide" | "delete") {
    setBusy(kind);
    await fetch("/api/articles/visibility", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    window.location.reload();
  }

  return (
    <div className="staticArticleAdminButtons">
      <button disabled={Boolean(busy)} onClick={() => hide("hide")} type="button">
        {busy === "hide" ? "更新中" : "非公開"}
      </button>
      <button disabled={Boolean(busy)} onClick={() => hide("delete")} type="button">
        {busy === "delete" ? "削除中" : "削除"}
      </button>
    </div>
  );
}
