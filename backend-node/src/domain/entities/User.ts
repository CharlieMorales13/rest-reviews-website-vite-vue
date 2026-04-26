export enum UserRole {
  STUDENT = "student",
  MANAGER = "manager",
  ADMIN = "admin",
}

export interface UserProps {
  id?: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
  bio?: string;
  universityId?: string;
  carrera?: string;
  verificationCode?: string;
  verificationExpires?: Date;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private props: UserProps;

  private constructor(props: UserProps) {
    this.props = {
      ...props,
      isActive: props.isActive ?? true,
      isVerified: props.isVerified ?? false,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  public static create(props: UserProps): User {
    // Business logic validation could go here
    if (!props.email.includes("@")) {
      throw new Error("Email structure is invalid");
    }
    return new User(props);
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get username(): string {
    return this.props.username;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get isActive(): boolean | undefined {
    return this.props.isActive;
  }
  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }
  get bio(): string | undefined {
    return this.props.bio;
  }
  get universityId(): string | undefined {
    return this.props.universityId;
  }
  get carrera(): string | undefined {
    return this.props.carrera;
  }
  get verificationCode(): string | undefined {
    return this.props.verificationCode;
  }
  get verificationExpires(): Date | undefined {
    return this.props.verificationExpires;
  }
  get isVerified(): boolean | undefined {
    return this.props.isVerified;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Setters/Mutations for Business Logic
  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public verify(): void {
    this.props.isVerified = true;
    this.props.verificationCode = undefined;
    this.props.verificationExpires = undefined;
    this.props.updatedAt = new Date();
  }

  public setVerificationCode(code: string, expiresAt: Date): void {
    this.props.verificationCode = code;
    this.props.verificationExpires = expiresAt;
    this.props.updatedAt = new Date();
  }

  public updatePasswordHash(newHash: string): void {
    this.props.passwordHash = newHash;
    this.props.updatedAt = new Date();
  }
}
