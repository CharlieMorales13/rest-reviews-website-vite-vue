import { container } from 'tsyringe';
import { PrismaReviewRepository } from '../repositories/PrismaReviewRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaEstablishmentRepository } from '../repositories/PrismaEstablishmentRepository';
import { PrismaMetricsRepository } from '../repositories/PrismaMetricsRepository';
import { SupabaseStorageService } from '../services/SupabaseStorageService';

// Register Repositories
container.register('IUserRepository', { useClass: PrismaUserRepository });
container.register('IEstablishmentRepository', { useClass: PrismaEstablishmentRepository });
container.register('IReviewRepository', { useClass: PrismaReviewRepository });
container.register('IMetricsRepository', { useClass: PrismaMetricsRepository });
container.register('IStorageService', { useClass: SupabaseStorageService });

export { container };
