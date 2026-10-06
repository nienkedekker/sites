import "server-only";

// Optional services: leave a key out and whatever needs it steps aside
export const hasRecs = () => Boolean(process.env.ANTHROPIC_API_KEY);
export const hasBackups = () => Boolean(process.env.CLOUDFLARE_BUCKET_NAME);
