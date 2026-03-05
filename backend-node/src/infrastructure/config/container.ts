import { container } from 'tsyringe';
import { PrismaReviewRepository } from '../repositories/PrismaReviewRepository';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository';
import { PrismaEstablishmentRepository } from '../repositories/PrismaEstablishmentRepository';

// Register tokens to implementations
container.register('IReviewRepository', { useClass: PrismaReviewRepository });
container.register('IUserRepository', { useClass: PrismaUserRepository });
container.register('IEstablishmentRepository', { useClass: PrismaEstablishmentRepository });

export { container };
