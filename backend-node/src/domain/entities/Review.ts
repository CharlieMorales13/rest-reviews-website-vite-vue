export interface ReviewProps {
    id?: string;
    userId: string;
    establishmentId: string;
    foodScore: number;
    serviceScore: number;
    priceScore: number;
    title?: string;
    comment?: string;
    imageUrl?: string;
    authorName?: string;
    authorCarrera?: string;
    establishmentName?: string;
    sentiment?: string;
    managerReply?: string;
    managerReplyAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Review {
    private props: ReviewProps;

    private constructor(props: ReviewProps) {
        this.props = {
            ...props,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    public static create(props: ReviewProps): Review {
        // 1. Business Logic Rules encapsulated within the entity
        this.validateScore(props.foodScore, 'Food');
        this.validateScore(props.serviceScore, 'Service');
        this.validateScore(props.priceScore, 'Price');

        if (props.comment && props.comment.trim().length < 10) {
            throw new Error('Review comment must be at least 10 characters long');
        }

        return new Review(props);
    }

    private static validateScore(score: number, type: string): void {
        if (score < 1 || score > 5) { // Assuming 1-5 scale. Update if 1-10.
            throw new Error(`${type} score must be between 1 and 5`);
        }
    }

    get id(): string | undefined { return this.props.id; }
    get userId(): string { return this.props.userId; }
    get establishmentId(): string { return this.props.establishmentId; }
    get foodScore(): number { return this.props.foodScore; }
    get serviceScore(): number { return this.props.serviceScore; }
    get priceScore(): number { return this.props.priceScore; }
    get title(): string | undefined { return this.props.title; }
    get comment(): string | undefined { return this.props.comment; }
    get imageUrl(): string | undefined { return this.props.imageUrl; }
    get authorName(): string | undefined { return this.props.authorName; }
    get authorCarrera(): string | undefined { return this.props.authorCarrera; }
    get establishmentName(): string | undefined { return this.props.establishmentName; }
    get sentiment(): string | undefined { return this.props.sentiment; }
    get managerReply(): string | undefined { return this.props.managerReply; }
    get managerReplyAt(): Date | undefined { return this.props.managerReplyAt; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get updatedAt(): Date | undefined { return this.props.updatedAt; }

    public updateContent(data: {
        foodScore?: number;
        serviceScore?: number;
        priceScore?: number;
        title?: string;
        comment?: string;
    }): void {
        if (data.foodScore !== undefined) {
            Review.validateScore(data.foodScore, 'Food');
            this.props.foodScore = data.foodScore;
        }
        if (data.serviceScore !== undefined) {
            Review.validateScore(data.serviceScore, 'Service');
            this.props.serviceScore = data.serviceScore;
        }
        if (data.priceScore !== undefined) {
            Review.validateScore(data.priceScore, 'Price');
            this.props.priceScore = data.priceScore;
        }
        if (data.title !== undefined) this.props.title = data.title;
        if (data.comment !== undefined) this.props.comment = data.comment;
        this.props.updatedAt = new Date();
    }

    public addManagerReply(reply: string): void {
        if (!reply || reply.trim().length < 5) {
            throw new Error('Manager reply must be at least 5 characters long');
        }
        this.props.managerReply = reply.trim();
        this.props.managerReplyAt = new Date();
        this.props.updatedAt = new Date();
    }
}
