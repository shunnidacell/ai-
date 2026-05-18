import { NextResponse } from "next/server";
import { latestArticles, officialPosts, trends } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    description:
      "Connect this endpoint to an X API/RSS collector, then pass clustered topics to the article generator.",
    nextSteps: [
      "Fetch X posts by keyword, list, and trusted accounts.",
      "Cluster similar posts and remove duplicates.",
      "Attach official sources before generating a draft.",
      "Store user reactions with source URLs for review.",
    ],
    officialPosts,
    trends,
    draftPreview: latestArticles,
  });
}
