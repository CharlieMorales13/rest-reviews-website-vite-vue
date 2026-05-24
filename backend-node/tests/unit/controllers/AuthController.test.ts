import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { Request, Response } from "express";

vi.mock("@/infrastructure/config/env.config", () => ({
  env: {
    JWT_SECRET: "test-secret-key-for-unit-tests",
    NODE_ENV: "test",
    RESEND_API_KEY: "test-resend-key",
    EMAIL_FROM: "test@test.com",
  },
}));

import { AuthController } from "@/infrastructure/http/controllers/AuthController";

const fakeUser = { id: "u1", email: "student@anahuac.mx", name: "Carlos", username: "carlos", role: "student" };

describe("AuthController", () => {
  describe("login", () => {
    it("sets HttpOnly cookies and returns 200 with user on successful login", async () => {
      const mockLoginUseCase = {
        execute: vi.fn().mockResolvedValue({
          user: fakeUser,
          token: "fake-jwt-token",
          refreshToken: "fake-refresh-token",
        }),
      } as any;

      const controller = new AuthController(
        {} as any,
        mockLoginUseCase,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );

      const req = {
        body: { email: "student@anahuac.mx", password: "password123" },
      } as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        cookie: vi.fn(),
      } as unknown as Response;

      await controller.login(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(200);

      // Tokens are now in HttpOnly cookies, not in the response body
      expect(res.cookie).toHaveBeenCalledWith(
        "access_token",
        "fake-jwt-token",
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        "refresh_token",
        "fake-refresh-token",
        expect.objectContaining({ httpOnly: true }),
      );

      // Body only contains the user object
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ user: fakeUser }),
        }),
      );
    });
  });

  describe("logout", () => {
    it("calls logoutUserUseCase if refresh token is present, clears cookies and returns 200", async () => {
      const mockLogoutUseCase = {
        execute: vi.fn().mockResolvedValue(undefined),
      } as any;

      const controller = new AuthController(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockLogoutUseCase,
      );

      const req = {
        cookies: { refresh_token: "existing-refresh-token" },
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        clearCookie: vi.fn(),
      } as unknown as Response;

      await controller.logout(req, res);

      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith("existing-refresh-token");
      expect(res.clearCookie).toHaveBeenCalledWith("access_token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Logged out" });
    });

    it("does not crash and still clears cookies if logoutUserUseCase throws error", async () => {
      const mockLogoutUseCase = {
        execute: vi.fn().mockRejectedValue(new Error("DB error")),
      } as any;

      const controller = new AuthController(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockLogoutUseCase,
      );

      const req = {
        cookies: { refresh_token: "existing-refresh-token" },
      } as unknown as Request;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        clearCookie: vi.fn(),
      } as unknown as Response;

      await controller.logout(req, res);

      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith("existing-refresh-token");
      expect(res.clearCookie).toHaveBeenCalledWith("access_token", expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith("refresh_token", expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, message: "Logged out" });
    });
  });
});
