import { injectable, inject } from 'tsyringe';
import { IMetricsRepository, GlobalMetrics } from '../../../domain/repositories/IMetricsRepository';

@injectable()
export class GetGlobalMetricsUseCase {
    constructor(
        @inject('IMetricsRepository') private metricsRepository: IMetricsRepository
    ) { }

    async execute(): Promise<GlobalMetrics> {
        return await this.metricsRepository.getGlobalSummary();
    }
}
