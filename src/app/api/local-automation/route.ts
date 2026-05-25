import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const projectDir = process.cwd();
const dataDir = path.join(projectDir, "data");
const disabledFile = path.join(dataDir, "bookmark-sync-disabled");
const statusFile = path.join(dataDir, "local-automation-status.json");
const logFile = path.join(dataDir, "local-automation.log");
const startupFile = path.join(
  process.env.APPDATA ?? "",
  "Microsoft",
  "Windows",
  "Start Menu",
  "Programs",
  "Startup",
  "AI Insight JP X Bookmark Auto Sync.cmd",
);

type LocalStatus = {
  available: boolean;
  startupEnabled: boolean;
  paused: boolean;
  message: string;
  taskStatus: unknown;
  recentLog: string;
};

export async function GET() {
  return Response.json(readLocalStatus());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = body.action;

  if (!isLocalAutomationAvailable()) {
    return Response.json(
      {
        error:
          "この操作はPC側のローカル管理画面でだけ使えます。Render上ではChrome/Ollamaを操作できません。",
      },
      { status: 409 },
    );
  }

  if (action === "enable") {
    const result = runPowerShellScript("enable-bookmark-autosync.ps1");
    if (result.status !== 0) {
      return Response.json(
        { error: result.stderr || result.stdout || "自動同期をオンにできませんでした。" },
        { status: 500 },
      );
    }
    startPowerShellScript("start-bookmark-autosync.ps1");
    return Response.json({
      ...readLocalStatus(),
      message: "自動同期をオンにして、今すぐバックグラウンド開始しました。",
    });
  }

  if (action === "disable") {
    const result = runPowerShellScript("disable-bookmark-autosync.ps1");
    if (result.status !== 0) {
      return Response.json(
        { error: result.stderr || result.stdout || "自動同期をオフにできませんでした。" },
        { status: 500 },
      );
    }
    return Response.json({
      ...readLocalStatus(),
      message: "自動同期をオフにしました。",
    });
  }

  if (action === "sync-and-generate") {
    startPowerShellScript("run-local-automation-task.ps1", "sync-and-generate");
    return Response.json({
      ...readLocalStatus(),
      message: "Xブックマーク同期と記事生成をバックグラウンドで開始しました。",
    });
  }

  if (action === "generate") {
    startPowerShellScript("run-local-automation-task.ps1", "generate");
    return Response.json({
      ...readLocalStatus(),
      message: "未生成候補の記事生成をバックグラウンドで開始しました。",
    });
  }

  return Response.json({ error: "Unknown action." }, { status: 400 });
}

function readLocalStatus(): LocalStatus {
  const available = isLocalAutomationAvailable();
  return {
    available,
    startupEnabled: safeExists(startupFile),
    paused: safeExists(disabledFile),
    message: available
      ? "PC側のローカル操作が使えます。"
      : "Render上では使えません。PCでローカル管理画面を開くと使えます。",
    taskStatus: readJson(statusFile),
    recentLog: readRecentLog(),
  };
}

function isLocalAutomationAvailable() {
  return process.platform === "win32" && !process.env.RENDER;
}

function runPowerShellScript(scriptName: string) {
  return spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(projectDir, "scripts", scriptName),
    ],
    {
      cwd: projectDir,
      encoding: "utf8",
    },
  );
}

function startPowerShellScript(scriptName: string, task?: string) {
  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join(projectDir, "scripts", scriptName),
  ];

  if (task) {
    args.push("-Task", task);
  }

  const child = spawn("powershell.exe", args, {
    cwd: projectDir,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  child.unref();
}

function safeExists(filePath: string) {
  try {
    return Boolean(filePath) && fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readJson(filePath: string) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readRecentLog() {
  try {
    const text = fs.readFileSync(logFile, "utf8");
    return text.split(/\r?\n/).slice(-60).join("\n").trim();
  } catch {
    return "";
  }
}
