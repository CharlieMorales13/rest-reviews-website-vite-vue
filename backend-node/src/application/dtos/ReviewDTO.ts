import { z } from "zod";
import { sanitizeHtml } from "../../infrastructure/http/utils/Sanitize";

export const CreateReviewSchema = z.object({
  userId: z.string().uuid("Invalid User ID format"), // populated server-side from JWT; not accepted from client
  establishmentId: z.string().uuid("Invalid Establishment ID format"),
  foodScore: z.number().int().min(1).max(5),
  serviceScore: z.number().int().min(1).max(5),
  priceScore: z.number().int().min(1).max(5),
  title: z
    .string()
    .min(5)
    .max(100)
    .optional()
    .transform((val) => (val ? sanitizeHtml(val) : undefined)),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters long")
    .optional()
    .transform((val) => (val ? sanitizeHtml(val) : undefined)),
  imageUrl: z
    .string()
    .url("Invalid Image URL format")
    .optional()
    .or(z.literal("")),
});

export type CreateReviewDTO = z.infer<typeof CreateReviewSchema>;

export const UpdateReviewSchema = z.object({
  foodScore: z.number().int().min(1).max(5).optional(),
  serviceScore: z.number().int().min(1).max(5).optional(),
  priceScore: z.number().int().min(1).max(5).optional(),
  title: z
    .string()
    .min(5)
    .max(100)
    .optional()
    .transform((val) => (val ? sanitizeHtml(val) : undefined)),
  comment: z
    .string()
    .min(10)
    .optional()
    .transform((val) => (val ? sanitizeHtml(val) : undefined)),
});

export type UpdateReviewDTO = z.infer<typeof UpdateReviewSchema>;

export const ReplyReviewSchema = z.object({
  reviewId: z.string().uuid("Invalid Review ID format"),
  managerId: z.string().uuid("Invalid Manager ID format"),
  reply: z
    .string()
    .min(5, "Reply must be at least 5 characters long")
    .transform(sanitizeHtml),
});

export type ReplyReviewDTO = z.infer<typeof ReplyReviewSchema>;
