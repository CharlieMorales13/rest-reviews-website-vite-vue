export enum UserRole {
    STUDENT = 'student',
    MANAGER = 'manager',
    ADMIN = 'admin',
}

export interface UserProps {
    id?: string;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    isActive?: boolean;
    avatarUrl?: string;
    bio?: string;
    universityId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class User {
    private props: UserProps;

    private constructor(props: UserProps) {
        this.props = {
            ...props,
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    public static create(props: UserProps): User {
        // Business logic validation could go here
        if (!props.email.includes('@')) {
            throw new Error('Email structure is invalid');
        }
        return new User(props);
    }

    // Getters
    get id(): string | undefined { return this.props.id; }
    get name(): string { return this.props.name; }
    get email(): string { return this.props.email; }
    get passwordHash(): string { return this.props.passwordHash; }
    get role(): UserRole { return this.props.role; }
    get isActive(): boolean | undefined { return this.props.isActive; }
    get avatarUrl(): string | undefined { return this.props.avatarUrl; }
    get bio(): string | undefined { return this.props.bio; }
    get universityId(): string | undefined { return this.props.universityId; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get updatedAt(): Date | undefined { return this.props.updatedAt; }

    // Setters/Mutations for Business Logic
    public deactivate(): void {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
}
