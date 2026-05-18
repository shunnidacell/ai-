import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { registerCandidate } from "@/lib/x-candidates";

const execFileAsync = promisify(execFile);

export async function POST() {
  try {
    const cwd = toWslPath(process.cwd());
    const command =
      'hermes -z "$(< data/hermes-collector-prompt.txt)" --skills social-media:xurl';

    const { stdout, stderr } = await execFileAsync(
      "wsl",
      ["-e", "bash", "-lc", `cd "${cwd}" && ${command}`],
      {
        maxBuffer: 1024 * 1024,
        timeout: 180_000,
      },
    );

    const urls = extractXPostUrls(stdout);
    const registered = [];

    for (const url of urls) {
      registered.push(await registerCandidate(url));
    }

    return NextResponse.json({
      urls,
      registered,
      stdout,
      stderr,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Hermesでの候補収集に失敗しました。",
      },
      { status: 500 },
    );
  }
}

function extractXPostUrls(text: string) {
  const matches = text.match(/https:\/\/(?:x|twitter)\.com\/[^/\s]+\/status\/\d+/g);
  return [...new Set(matches ?? [])].map((url) =>
    url.replace("https://twitter.com/", "https://x.com/"),
  );
}

function toWslPath(windowsPath: string) {
  const match = windowsPath.match(/^([A-Za-z]):\\(.*)$/);

  if (!match) {
    return windowsPath.replaceAll("\\", "/");
  }

  return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll("\\", "/")}`;
}
