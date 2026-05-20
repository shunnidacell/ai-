"use client";

import { useState } from "react";

export function DeletedItemActions({
  id,
  type,
}: {
  id: string;
  type: "candidate" | "static";
}) {
  const [busy, setBusy] = useState<"purge" | "restore" | null>(null);

  async function run(action: "purge" | "restore") {
    setBusy(action);
    await fetch(type === "candidate" ? "/api/x-candidates" : "/api/articles/visibility", {
      method: type === "candidate" ? "DELETE" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    window.location.reload();
  }

  return (
    <div className="deletedItemActions">
      <button disabled={Boolean(busy)} onClick={() => run("restore")} type="button">
        {busy === "restore" ? "復元中" : "復元"}
      </button>
      <button disabled={Boolean(busy)} onClick={() => run("purge")} type="button">
        {busy === "purge" ? "削除中" : "完全に削除"}
      </button>
    </div>
  );
}
