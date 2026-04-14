export interface EstablishmentPostProps {
    id?: string;
    establishmentId: string;
    authorId: string;
    content: string;
    imageUrls?: string[];
    isPublished?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class EstablishmentPost {
    private props: EstablishmentPostProps;

    private constructor(props: EstablishmentPostProps) {
        this.props = {
            ...props,
            imageUrls: props.imageUrls ?? [],
            isPublished: props.isPublished ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    public static create(props: EstablishmentPostProps): EstablishmentPost {
        if (!props.content || props.content.trim().length === 0) {
            throw new Error('Post content cannot be empty');
        }
        if (props.imageUrls && props.imageUrls.length > 4) {
            throw new Error('Post cannot have more than 4 images');
        }
        return new EstablishmentPost(props);
    }

    get id(): string | undefined { return this.props.id; }
    get establishmentId(): string { return this.props.establishmentId; }
    get authorId(): string { return this.props.authorId; }
    get content(): string { return this.props.content; }
    get imageUrls(): string[] { return this.props.imageUrls ?? []; }
    get isPublished(): boolean { return this.props.isPublished ?? true; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get updatedAt(): Date | undefined { return this.props.updatedAt; }
}
