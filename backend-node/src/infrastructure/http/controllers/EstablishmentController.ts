import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { CreateEstablishmentUseCase } from '../../../application/use-cases/establishments/CreateEstablishmentUseCase';
import { GetEstablishmentUseCase } from '../../../application/use-cases/establishments/GetEstablishmentUseCase';
import { ListEstablishmentsUseCase } from '../../../application/use-cases/establishments/ListEstablishmentsUseCase';
import { UpdateEstablishmentUseCase } from '../../../application/use-cases/establishments/UpdateEstablishmentUseCase';
import { DeleteEstablishmentUseCase } from '../../../application/use-cases/establishments/DeleteEstablishmentUseCase';
import { CreateEstablishmentSchema, UpdateEstablishmentSchema } from '../../../application/dtos/EstablishmentDTO';
import { createPaginatedResponse } from '../utils/Pagination';
import { AuthRequest } from '../middlewares/AuthMiddleware';

@injectable()
export class EstablishmentController {
    constructor(
        @inject(CreateEstablishmentUseCase) private createUseCase: CreateEstablishmentUseCase,
        @inject(GetEstablishmentUseCase) private getUseCase: GetEstablishmentUseCase,
        @inject(ListEstablishmentsUseCase) private listUseCase: ListEstablishmentsUseCase,
        @inject(UpdateEstablishmentUseCase) private updateUseCase: UpdateEstablishmentUseCase,
        @inject(DeleteEstablishmentUseCase) private deleteUseCase: DeleteEstablishmentUseCase
    ) { }

    /**
     * @swagger
     * /establishments:
     *   post:
     *     summary: Create a new establishment
     *     tags: [Establishments]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateEstablishmentInput'
     *     responses:
     *       201:
     *         description: Created
     */
    public create = async (req: Request, res: Response): Promise<void> => {
        const validatedData = CreateEstablishmentSchema.parse(req.body);
        const establishment = await this.createUseCase.execute(validatedData);
        res.status(201).json({ success: true, data: establishment });
    };

    /**
     * @swagger
     * /establishments:
     *   get:
     *     summary: List establishments with optional filters and pagination
     *     tags: [Establishments]
     *     parameters:
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         description: Filter by name (partial match)
     *       - in: query
     *         name: universityId
     *         schema:
     *           type: string
     *         description: Filter by university ID
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Results per page
     *     responses:
     *       200:
     *         description: OK
     */
    public getAll = async (req: Request, res: Response): Promise<void> => {
        const { name, universityId, page, limit } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        const { data, total } = await this.listUseCase.execute(
            {
                name: name as string,
                universityId: universityId as string
            },
            { page: pageNum, limit: limitNum }
        );

        res.status(200).json(
            createPaginatedResponse(data, total, pageNum, limitNum)
        );
    };

    /**
     * @swagger
     * /establishments/{id}:
     *   get:
     *     summary: Get establishment by ID
     *     tags: [Establishments]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: OK
     */
    public getById = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const establishment = await this.getUseCase.execute(id);
        res.status(200).json({ success: true, data: establishment });
    };

    /**
     * @swagger
     * /establishments/{id}:
     *   put:
     *     summary: Update an establishment
     *     tags: [Establishments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateEstablishmentInput'
     *     responses:
     *       200:
     *         description: Updated
     */
    public update = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const user = req.user;
        const validatedData = UpdateEstablishmentSchema.parse(req.body);
        
        const establishment = await this.updateUseCase.execute(id, validatedData, user ? {
            id: user.userId,
            role: user.role
        } : undefined);
        
        res.status(200).json({ success: true, data: establishment });
    };

    /**
     * @swagger
     * /establishments/{id}:
     *   delete:
     *     summary: Delete an establishment
     *     tags: [Establishments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Deleted
     */
    public delete = async (req: AuthRequest, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const user = req.user;

        await this.deleteUseCase.execute(id, user ? {
            id: user.userId,
            role: user.role
        } : undefined);
        
        res.status(204).send();
    };
}
