import "reflect-metadata";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogoutUserUseCase } from "@/application/use-cases/auth/LogoutUserUseCase";

vi.mock("@/infrastructure/database/prisma.service", () => ({
  default: {
    userSession: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("LogoutUserUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not update anything if session is not found", async () => {
    const prisma = await import("@/infrastructure/database/prisma.service");
    vi.mocked(prisma.default.userSession.findFirst).mockResolvedValue(null);

    const useCase = new LogoutUserUseCase();
    await useCase.execute("non-existent-token");

    expect(prisma.default.userSession.findFirst).toHaveBeenCalledWith({
      where: {
        refreshToken: "non-existent-token",
        isRevoked: false,
      },
    });
    expect(prisma.default.userSession.update).not.toHaveBeenCalled();
  });

  it("marks session as revoked if found", async () => {
    const prisma = await import("@/infrastructure/database/prisma.service");
    const mockSession = {
      id: "session-uuid",
      userId: "user-uuid",
      refreshToken: "valid-token",
      isRevoked: false,
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    vi.mocked(prisma.default.userSession.findFirst).mockResolvedValue(mockSession);
    vi.mocked(prisma.default.userSession.update).mockResolvedValue({} as any);

    const useCase = new LogoutUserUseCase();
    await useCase.execute("valid-token");

    expect(prisma.default.userSession.findFirst).toHaveBeenCalledWith({
      where: {
        refreshToken: "valid-token",
        isRevoked: false,
      },
    });
    expect(prisma.default.userSession.update).toHaveBeenCalledWith({
      where: { id: "session-uuid" },
      data: { isRevoked: true },
    });
  });
});
