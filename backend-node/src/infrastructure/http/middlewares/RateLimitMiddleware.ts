import rateLimit from "express-rate-limit";
import { AuthRequest } from "./AuthMiddleware";

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Login: 30 req / 15 min per IP. High limit — campus shares one public IP. */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: "Too many login attempts. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Register: 10 req / hour per IP. */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many registration attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Email verification: 5 attempts / 15 min per email. Per-email key — campus shared IP. */
export const verifyEmailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.body?.email as string) ?? req.ip ?? "unknown",
  message: {
    success: false,
    error: "Too many verification attempts. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Resend verification: 3 resends / hour per email. */
export const resendVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => (req.body?.email as string) ?? req.ip ?? "unknown",
  message: {
    success: false,
    error: "Too many resend requests. Try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Forgot password: 5 req / 15 min per IP. */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many password reset requests. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Reviews ───────────────────────────────────────────────────────────────────

/** Create review: 10 / hour per user. */
export const reviewRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: {
    success: false,
    message:
      "Has alcanzado el límite de reseñas por hora. Inténtalo más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Edit / delete own review: 30 / hour per user. */
export const reviewMutationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: { success: false, error: "Too many review edits. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Like / unlike: 60 / hour per user. */
export const likeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: { success: false, error: "Too many like actions. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Manager reply to review: 20 / hour per user. */
export const replyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: {
    success: false,
    error: "Too many reply attempts. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Uploads ───────────────────────────────────────────────────────────────────

/** File upload: 20 / hour per user. */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: {
    success: false,
    message:
      "Has alcanzado el límite de subidas por hora. Inténtalo más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public reads ──────────────────────────────────────────────────────────────

/** Public GET endpoints (establishments, reviews): 100 / 15 min per IP. */
export const publicReadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Too many requests. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Authenticated reads ───────────────────────────────────────────────────────

/** Metrics / notifications reads: 200 / 15 min per user. */
export const authenticatedReadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: {
    success: false,
    error: "Too many requests. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Manager / admin writes ────────────────────────────────────────────────────

/** Establishment and post writes (manager/admin): 20 / hour per user. */
export const managerWriteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: {
    success: false,
    error: "Too many write operations. Try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── ML Pipeline ───────────────────────────────────────────────────────────────

/** Analytics pipeline trigger: 5 / hour per user. Expensive operation. */
export const pipelineRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req as AuthRequest).user?.userId ?? "unauthenticated",
  message: {
    success: false,
    error: "Pipeline trigger limit reached. Try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
