import { injectable, inject } from "tsyringe";
import {
  IMetricsRepository,
  EstablishmentMetricSummary,
} from "../../../domain/repositories/IMetricsRepository";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { AppError } from "../../../infrastructure/http/errors/AppError";

@injectable()
export class GetEstablishmentMetricsUseCase {
  constructor(
    @inject("IMetricsRepository") private metricsRepository: IMetricsRepository,
    @inject("IEstablishmentRepository")
    private establishmentRepository: IEstablishmentRepository,
  ) {}

  async execute(establishmentId: string): Promise<EstablishmentMetricSummary> {
    const est = await this.establishmentRepository.findById(establishmentId);
    if (!est) {
      throw new AppError("Establishment not found", 404);
    }

    const metrics =
      await this.metricsRepository.getEstablishmentSummary(establishmentId);
    if (!metrics) {
      throw new AppError("Establishment metrics not found", 404);
    }
    return metrics;
  }
}
