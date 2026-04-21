import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../../config/logger";
import { AppError } from "../errors/AppError";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(
    {
      message: err.message,
      stack: err.stack,
      path: _req.path,
      method: _req.method,
    },
    "[Global Error]",
  );

  // Handle Zod Validation Errors globally
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: (err as any).errors,
    });
    return;
  }

  // Handle standard App Error globally
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Fallback
  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
