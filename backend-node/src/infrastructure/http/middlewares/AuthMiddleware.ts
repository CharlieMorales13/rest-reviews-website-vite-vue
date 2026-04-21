import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env.config";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthRequest["user"];
    req.user = decoded;
    next();
  } catch (_error) {
    res
      .status(403)
      .json({ success: false, message: "Invalid or expired token." });
    return;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Access denied. Insufficient role permissions.",
      });
      return;
    }
    next();
  };
};
