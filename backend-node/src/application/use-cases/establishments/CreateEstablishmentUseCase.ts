import { injectable, inject } from "tsyringe";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { Establishment } from "../../../domain/entities/Establishment";
import { CreateEstablishmentDTO } from "../../dtos/EstablishmentDTO";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

@injectable()
export class CreateEstablishmentUseCase {
  constructor(
    @inject("IEstablishmentRepository")
    private repository: IEstablishmentRepository,
  ) {}

  async execute(dto: CreateEstablishmentDTO): Promise<Establishment> {
    const slug = toSlug(dto.name);
    const establishment = Establishment.create({
      name: dto.name,
      slug,
      description: dto.description,
      category: dto.category,
      managerId: dto.managerId,
      universityId: dto.universityId,
      locationDetails: dto.locationDetails,
      openingHours: dto.openingHours,
      galleryUrls: dto.galleryUrls,
      menuUrls: dto.menuUrls,
    });

    return await this.repository.save(establishment);
  }
}
