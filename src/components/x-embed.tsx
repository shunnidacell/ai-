export function XEmbed({ url }: { url: string }) {
  return (
    <div className="xEmbedWrap">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url}>{url}</a>
      </blockquote>
      <a
        className="xEmbedFallback"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        Xでポストを開く
      </a>
    </div>
  );
}
