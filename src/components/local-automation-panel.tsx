"use client";

import { useEffect, useState, useTransition } from "react";
import { FileText, Play, RefreshCw } from "lucide-react";

type AutomationStatus = {
  available: boolean;
  message: string;
  taskStatus: {
    phase?: string;
    running?: boolean;
    message?: string;
    updatedAt?: string;
  } | null;
  recentLog: string;
};

const initialStatus: AutomationStatus = {
  available: false,
  message: "状態を読み込み中です。",
  taskStatus: null,
  recentLog: "",
};

export function LocalAutomationPanel() {
  const [status, setStatus] = useState<AutomationStatus>(initialStatus);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadStatus() {
    const response = await fetch("/api/local-automation", { cache: "no-store" });
    const result = (await response.json()) as AutomationStatus;
    setStatus(result);
  }

  async function runAction(action: string) {
    setMessage("処理を開始しています。");
    startTransition(async () => {
      const response = await fetch("/api/local-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "操作に失敗しました。");
        return;
      }
      setStatus(result);
      setMessage(result.message ?? "処理を開始しました。");
      window.setTimeout(loadStatus, 1200);
    });
  }

  useEffect(() => {
    loadStatus();
    const timer = window.setInterval(loadStatus, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const taskMessage =
    status.taskStatus?.message ??
    "手動モードです。必要な時だけボタンを押して同期・記事生成します。";

  return (
    <section className="panel localAutomationPanel compactPanel">
      <div className="panelHeader">
        <div>
          <p className="adminKicker">手動操作</p>
          <h1>Xブックマーク同期と記事生成</h1>
          <p>
            PC側のChromeでXブックマークを読み込み、Ollamaで未生成の記事本文を作ります。
            10分ごとの自動実行は使いません。
          </p>
        </div>
        <button className="localAutomationIconButton" onClick={loadStatus} type="button">
          <RefreshCw size={16} />
          更新
        </button>
      </div>

      <div className="localAutomationStatus">
        <span>{status.available ? "ローカル操作OK" : "Renderでは操作不可"}</span>
        <span>手動モード</span>
        {status.taskStatus?.running && <span>実行中: {status.taskStatus.phase}</span>}
      </div>

      <p className="localAutomationMessage">{message || taskMessage}</p>

      <div className="localAutomationActions">
        <button
          disabled={!status.available || isPending}
          onClick={() => runAction("sync-and-generate")}
          type="button"
        >
          <Play size={16} />
          今すぐ同期して記事生成
        </button>
        <button
          disabled={!status.available || isPending}
          onClick={() => runAction("generate")}
          type="button"
        >
          <FileText size={16} />
          未生成だけ記事生成
        </button>
      </div>

      {status.recentLog && (
        <details className="localAutomationLog">
          <summary>直近ログを見る</summary>
          <pre>{status.recentLog}</pre>
        </details>
      )}
    </section>
  );
}
