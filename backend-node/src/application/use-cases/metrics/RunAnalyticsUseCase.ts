import { injectable, inject } from 'tsyringe';
import { IAnalyticsService, AnalyticsResult } from '../../../domain/services/IAnalyticsService';

@injectable()
export class RunAnalyticsUseCase {
    constructor(
        @inject('IAnalyticsService') private analyticsService: IAnalyticsService
    ) { }

    async execute(): Promise<AnalyticsResult> {
        return await this.analyticsService.runSentimentAnalysis();
    }
}
