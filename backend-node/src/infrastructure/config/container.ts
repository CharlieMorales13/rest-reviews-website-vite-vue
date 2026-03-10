import { container } from 'tsyringe';
import { PrismaReviewRepository } from '../repositories/PrismaReviewRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaEstablishmentRepository } from '../repositories/PrismaEstablishmentRepository';

// Register Repositories
container.register('IUserRepository', { useClass: PrismaUserRepository });
container.register('IEstablishmentRepository', { useClass: PrismaEstablishmentRepository });
container.register('IReviewRepository', { useClass: PrismaReviewRepository });

export { container };
