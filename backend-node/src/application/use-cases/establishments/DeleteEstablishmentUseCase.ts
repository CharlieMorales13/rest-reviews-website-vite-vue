import { injectable, inject } from "tsyringe";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class DeleteEstablishmentUseCase {
  constructor(
    @inject("IEstablishmentRepository")
    private repository: IEstablishmentRepository,
  ) {}

  async execute(
    id: string,
    requester?: { id: string; role: string },
  ): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError("Establishment not found", 404);
    }

    // Ownership Check: Only admin or the assigned manager can delete
    if (
      requester &&
      requester.role !== "admin" &&
      existing.managerId !== requester.id
    ) {
      throw new AppError(
        "You do not have permission to delete this establishment",
        403,
      );
    }

    await this.repository.delete(id);
  }
}
