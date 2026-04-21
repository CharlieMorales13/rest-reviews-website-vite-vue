import { injectable, inject } from "tsyringe";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { User } from "../../../domain/entities/User";

@injectable()
export class ListUsersUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
  ) {}

  async execute(pagination?: {
    page: number;
    limit: number;
  }): Promise<{ data: User[]; total: number }> {
    return await this.userRepository.findAll(pagination);
  }
}
