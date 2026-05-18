import type { XPost } from "@/lib/mock-data";
import { XEmbed } from "@/components/x-embed";

export function XPostCard({
  compact = false,
  post,
}: {
  compact?: boolean;
  post: XPost;
}) {
  return (
    <div className={compact ? "compactXPost" : undefined}>
      <XEmbed url={post.url} />
    </div>
  );
}
