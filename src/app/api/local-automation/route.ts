import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const projectDir = process.cwd();
const dataDir = path.join(projectDir, "data");
const statusFile = path.join(dataDir, "local-automation-status.json");
const logFile = path.join(dataDir, "local-automation.log");

type LocalStatus = {
  available: boolean;
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
    message: available
      ? "手動操作が使えます。必要な時だけボタンを押してください。"
      : "Render上では使えません。PCでローカル管理画面を開くと使えます。",
    taskStatus: readJson(statusFile),
    recentLog: readRecentLog(),
  };
}

function isLocalAutomationAvailable() {
  return process.platform === "win32" && !process.env.RENDER;
}

function startPowerShellScript(scriptName: string, task: string) {
  const child = spawn(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(projectDir, "scripts", scriptName),
      "-Task",
      task,
    ],
    {
      cwd: projectDir,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    },
  );

  child.unref();
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
