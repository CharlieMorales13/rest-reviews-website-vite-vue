export interface NotificationProps {
  id?: string;
  userId: string;
  reviewId: string;
  type?: string;
  isRead?: boolean;
  createdAt?: Date;
}

export class Notification {
  private props: NotificationProps;

  private constructor(props: NotificationProps) {
    this.props = {
      type: "manager_reply",
      isRead: false,
      ...props,
      createdAt: props.createdAt ?? new Date(),
    };
  }

  public static create(props: NotificationProps): Notification {
    return new Notification(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get reviewId(): string {
    return this.props.reviewId;
  }
  get type(): string {
    return this.props.type!;
  }
  get isRead(): boolean {
    return this.props.isRead!;
  }
  get createdAt(): Date {
    return this.props.createdAt!;
  }

  markAsRead(): void {
    this.props.isRead = true;
  }
}
