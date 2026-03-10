import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GetGlobalMetricsUseCase } from '../../../application/use-cases/metrics/GetGlobalMetricsUseCase';

@injectable()
export class MetricsController {
    constructor(
        @inject(GetGlobalMetricsUseCase) private getGlobalMetricsUseCase: GetGlobalMetricsUseCase
    ) { }

    /**
     * @swagger
     * /metrics/summary:
     *   get:
     *     summary: Get global sentiment and establishment metrics for the analytical dashboard
     *     tags: [Analytics]
     *     responses:
     *       200:
     *         description: Global metrics summary
     */
    public getSummary = async (_req: Request, res: Response): Promise<void> => {
        const metrics = await this.getGlobalMetricsUseCase.execute();
        res.status(200).json({
            success: true,
            data: metrics
        });
    };
}
