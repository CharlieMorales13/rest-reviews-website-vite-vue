import { injectable } from "tsyringe";
import prisma from "../../../infrastructure/database/prisma.service";

@injectable()
export class LogoutUserUseCase {
  async execute(refreshToken: string): Promise<void> {
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken,
        isRevoked: false,
      },
    });

    if (session) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
    }
  }
}
