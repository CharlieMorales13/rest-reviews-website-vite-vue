export interface EstablishmentProps {
    id?: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    category?: string | null;
    managerId?: string | null;
    universityId?: string | null;
    locationDetails?: string | null;
    openingHours?: string | null;
    galleryUrls?: string[];
    menuUrls?: string[];
    logoUrl?: string | null;
    coverUrl?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Establishment {
    private props: EstablishmentProps;

    private constructor(props: EstablishmentProps) {
        this.props = {
            ...props,
            galleryUrls: props.galleryUrls ?? [],
            menuUrls: props.menuUrls ?? [],
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    public static create(props: EstablishmentProps): Establishment {
        if (!props.name || props.name.trim().length === 0) {
            throw new Error('Establishment name cannot be empty');
        }
        return new Establishment(props);
    }

    get id(): string | undefined { return this.props.id; }
    get name(): string { return this.props.name; }
    get slug(): string | null | undefined { return this.props.slug; }
    get description(): string | null | undefined { return this.props.description; }
    get category(): string | null | undefined { return this.props.category; }
    get managerId(): string | null | undefined { return this.props.managerId; }
    get universityId(): string | null | undefined { return this.props.universityId; }
    get locationDetails(): string | null | undefined { return this.props.locationDetails; }
    get openingHours(): string | null | undefined { return this.props.openingHours; }
    get galleryUrls(): string[] | undefined { return this.props.galleryUrls; }
    get menuUrls(): string[] | undefined { return this.props.menuUrls; }
    get logoUrl(): string | null | undefined { return this.props.logoUrl; }
    get coverUrl(): string | null | undefined { return this.props.coverUrl; }
    get isActive(): boolean | undefined { return this.props.isActive; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get updatedAt(): Date | undefined { return this.props.updatedAt; }

    public assignManager(managerId: string): void {
        this.props.managerId = managerId;
        this.props.updatedAt = new Date();
    }
}
