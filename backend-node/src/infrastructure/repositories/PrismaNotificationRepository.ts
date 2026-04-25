import prisma from "../database/prisma.service";
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { Notification } from "../../domain/entities/Notification";
import { injectable } from "tsyringe";

@injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  async save(notification: Notification): Promise<Notification> {
    const data = await prisma.notification.create({
      data: {
        userId: notification.userId,
        reviewId: notification.reviewId,
        type: notification.type,
        isRead: notification.isRead,
        actorName: notification.actorName,
      } as any,
    });
    return this.mapToDomain(data);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const data = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return data.map(this.mapToDomain);
  }

  async findById(id: string): Promise<Notification | null> {
    const data = await prisma.notification.findUnique({ where: { id } });
    if (!data) return null;
    return this.mapToDomain(data);
  }

  async update(notification: Notification): Promise<Notification> {
    if (!notification.id)
      throw new Error("Cannot update a notification without an id");
    const data = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: notification.isRead },
    });
    return this.mapToDomain(data);
  }

  private mapToDomain(data: any): Notification {
    return Notification.create({
      id: data.id,
      userId: data.userId,
      reviewId: data.reviewId,
      type: data.type,
      isRead: data.isRead,
      createdAt: data.createdAt,
      actorName: data.actorName ?? undefined,
    });
  }
}
