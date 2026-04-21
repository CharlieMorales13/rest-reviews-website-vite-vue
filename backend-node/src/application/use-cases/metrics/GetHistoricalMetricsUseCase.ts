import { injectable, inject } from "tsyringe";
import { IMetricsRepository } from "../../../domain/repositories/IMetricsRepository";
import { IEstablishmentRepository } from "../../../domain/repositories/IEstablishmentRepository";
import { AppError } from "../../../infrastructure/http/errors/AppError";
import {
  HistoricalMetricsResponse,
  TimeSeriesDataPoint,
} from "../../dtos/MetricsDTO";

@injectable()
export class GetHistoricalMetricsUseCase {
  constructor(
    @inject("IMetricsRepository") private metricsRepository: IMetricsRepository,
    @inject("IEstablishmentRepository")
    private establishmentRepository: IEstablishmentRepository,
  ) {}

  async execute(
    establishmentId: string,
    days: number = 30,
  ): Promise<HistoricalMetricsResponse> {
    const est = await this.establishmentRepository.findById(establishmentId);
    if (!est) {
      throw new AppError("Establishment not found", 404);
    }

    const snapshots = await this.metricsRepository.getHistoricalMetrics(
      establishmentId,
      days,
    );

    const series: TimeSeriesDataPoint[] = snapshots.map((s) => ({
      date: s.snapshotDate.toISOString().split("T")[0],
      ige: Number(s.ige),
      avgFood: Number(s.avgFood),
      avgService: Number(s.avgService),
      avgPrice: Number(s.avgPrice),
      totalReviews: s.totalReviews,
    }));

    return {
      establishmentId: est.id || "",
      name: est.name,
      series,
    };
  }
}
