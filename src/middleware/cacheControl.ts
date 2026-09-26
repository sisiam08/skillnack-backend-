import { NextFunction, Request, Response } from "express";

/**
 * Sets a conservative Cache-Control header on public, non-user-specific reads.
 * Only applied to static-ish taxonomy endpoints; dynamic listings keep relying
 * on the Next.js fetch cache (revalidate/tags) to avoid double-caching.
 */
export const cachePublic = (seconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`,
    );
    next();
  };
};
