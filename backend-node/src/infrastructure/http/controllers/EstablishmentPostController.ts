import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ListEstablishmentPostsUseCase } from '../../../application/use-cases/posts/ListEstablishmentPostsUseCase';
import { CreateEstablishmentPostUseCase } from '../../../application/use-cases/posts/CreateEstablishmentPostUseCase';
import { UpdateEstablishmentPostUseCase } from '../../../application/use-cases/posts/UpdateEstablishmentPostUseCase';
import { DeleteEstablishmentPostUseCase } from '../../../application/use-cases/posts/DeleteEstablishmentPostUseCase';
import { CreateEstablishmentPostSchema, UpdateEstablishmentPostSchema } from '../../../application/dtos/EstablishmentPostDTO';
import { AuthRequest } from '../middlewares/AuthMiddleware';

@injectable()
export class EstablishmentPostController {
    constructor(
        @inject(ListEstablishmentPostsUseCase) private listUseCase: ListEstablishmentPostsUseCase,
        @inject(CreateEstablishmentPostUseCase) private createUseCase: CreateEstablishmentPostUseCase,
        @inject(UpdateEstablishmentPostUseCase) private updateUseCase: UpdateEstablishmentPostUseCase,
        @inject(DeleteEstablishmentPostUseCase) private deleteUseCase: DeleteEstablishmentPostUseCase,
    ) { }

    public list = async (req: Request, res: Response): Promise<void> => {
        const slug = req.params.slug as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

        const { data, total } = await this.listUseCase.execute(slug, { page, limit });

        const mapped = data.map(p => ({
            id: p.id,
            content: p.content,
            imageUrls: p.imageUrls,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        }));

        res.status(200).json({
            success: true,
            data: mapped,
            meta: { total, page, limit },
        });
    };

    public create = async (req: AuthRequest, res: Response): Promise<void> => {
        const slug = req.params.slug as string;
        const user = req.user!;
        const dto = CreateEstablishmentPostSchema.parse(req.body);

        const post = await this.createUseCase.execute(slug, dto, { id: user.userId, role: user.role });

        res.status(201).json({
            success: true,
            data: {
                id: post.id,
                content: post.content,
                imageUrls: post.imageUrls,
                createdAt: post.createdAt,
            },
        });
    };

    public update = async (req: AuthRequest, res: Response): Promise<void> => {
        const postId = req.params.postId as string;
        const user = req.user!;
        const dto = UpdateEstablishmentPostSchema.parse(req.body);

        const post = await this.updateUseCase.execute(postId, dto, { id: user.userId, role: user.role });

        res.status(200).json({
            success: true,
            data: {
                id: post.id,
                content: post.content,
                imageUrls: post.imageUrls,
                updatedAt: post.updatedAt,
            },
        });
    };

    public delete = async (req: AuthRequest, res: Response): Promise<void> => {
        const postId = req.params.postId as string;
        const user = req.user!;

        await this.deleteUseCase.execute(postId, { id: user.userId, role: user.role });

        res.status(204).send();
    };
}
