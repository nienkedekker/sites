import "server-only";

// Optional services: leave a key out and whatever needs it steps aside
export const hasRecs = () => Boolean(process.env.ANTHROPIC_API_KEY);
export const hasBackups = () => Boolean(process.env.CLOUDFLARE_BUCKET_NAME);
export const hasUpcoming = () => Boolean(process.env.HARDCOVER_API_TOKEN);
export const hasNanami = () =>
  Boolean(
    process.env.NANAMI_PUSH_TOKEN &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN,
  );
