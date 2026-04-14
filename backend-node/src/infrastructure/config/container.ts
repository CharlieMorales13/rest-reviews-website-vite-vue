import { container } from 'tsyringe';
import { PrismaReviewRepository } from '../repositories/PrismaReviewRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaEstablishmentRepository } from '../repositories/PrismaEstablishmentRepository';
import { PrismaEstablishmentPostRepository } from '../repositories/PrismaEstablishmentPostRepository';
import { PrismaMetricsRepository } from '../repositories/PrismaMetricsRepository';
import { SupabaseStorageService } from '../services/SupabaseStorageService';
import { AnalyticsService } from '../services/AnalyticsService';

// Register Repositories
container.register('IUserRepository', { useClass: PrismaUserRepository });
container.register('IEstablishmentRepository', { useClass: PrismaEstablishmentRepository });
container.register('IEstablishmentPostRepository', { useClass: PrismaEstablishmentPostRepository });
container.register('IReviewRepository', { useClass: PrismaReviewRepository });
container.register('IMetricsRepository', { useClass: PrismaMetricsRepository });
container.register('IStorageService', { useClass: SupabaseStorageService });
container.register('IAnalyticsService', { useClass: AnalyticsService });

export { container };
