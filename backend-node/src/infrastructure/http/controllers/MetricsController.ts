import { Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GetGlobalMetricsUseCase } from '../../../application/use-cases/metrics/GetGlobalMetricsUseCase';
import { GetEstablishmentMetricsUseCase } from '../../../application/use-cases/metrics/GetEstablishmentMetricsUseCase';
import { GetManagerEstablishmentsUseCase } from '../../../application/use-cases/metrics/GetManagerEstablishmentsUseCase';
import { AuthRequest } from '../middlewares/AuthMiddleware';
import { AppError } from '../errors/AppError';

@injectable()
export class MetricsController {
    constructor(
        @inject(GetGlobalMetricsUseCase) private getGlobalMetricsUseCase: GetGlobalMetricsUseCase,
        @inject(GetEstablishmentMetricsUseCase) private getEstablishmentMetricsUseCase: GetEstablishmentMetricsUseCase,
        @inject(GetManagerEstablishmentsUseCase) private getManagerEstablishmentsUseCase: GetManagerEstablishmentsUseCase
    ) { }

    /**
     * @swagger
     * /metrics/summary:
     *   get:
     *     summary: Get sentiment and establishment metrics for the analytical dashboard (Role-aware)
     *     tags: [Analytics]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Metrics summary
     */
    public getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user;
        if (!user) throw new AppError('Unauthorized', 401);
        if (user.role === 'admin') {
            const metrics = await this.getGlobalMetricsUseCase.execute();
            res.status(200).json({ success: true, data: metrics });
            return;
        }

        if (user.role === 'manager') {
            const establishments = await this.getManagerEstablishmentsUseCase.execute(user.userId);
            if (establishments.length === 0) {
                res.status(200).json({ success: true, data: { establishments: [] } });
                return;
            }

            // Get metrics for all managed establishments
            const metrics = await Promise.all(
                establishments.map(e => this.getEstablishmentMetricsUseCase.execute(e.id || ''))
            );

            // Always return as an array to keep frontend logic simple and consistent
            res.status(200).json({ 
                success: true, 
                data: { establishments: metrics } 
            });
            return;
        }

        res.status(403).json({ success: false, message: 'Forbidden' });
    };

    /**
     * @swagger
     * /metrics/establishment/{id}:
     *   get:
     *     summary: Get metrics for a specific establishment (Admin or Owner only)
     *     tags: [Analytics]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Establishment metrics
     */
    public getByEstablishmentId = async (req: AuthRequest, res: Response): Promise<void> => {
        const { id } = req.params;
        const user = req.user;

        if (!user) throw new AppError('Unauthorized', 0);

        // Security Check: Only admin or the establishment's manager can see its metrics
        if (user.role !== 'admin') {
            const establishments = await this.getManagerEstablishmentsUseCase.execute(user.userId);
            const isManager = establishments.some(e => e.id === id);
            if (!isManager) {
                throw new AppError('Access denied. You do not manage this establishment.', 403);
            }
        }

        const metrics = await this.getEstablishmentMetricsUseCase.execute(id as string);
        res.status(200).json({ success: true, data: metrics });
    };
}
