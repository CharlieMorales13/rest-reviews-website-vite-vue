import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { CreateEstablishmentUseCase } from '../../../application/use-cases/establishments/CreateEstablishmentUseCase';
import { GetEstablishmentUseCase } from '../../../application/use-cases/establishments/GetEstablishmentUseCase';
import { ListEstablishmentsUseCase } from '../../../application/use-cases/establishments/ListEstablishmentsUseCase';
import { UpdateEstablishmentUseCase } from '../../../application/use-cases/establishments/UpdateEstablishmentUseCase';
import { DeleteEstablishmentUseCase } from '../../../application/use-cases/establishments/DeleteEstablishmentUseCase';
import { CreateEstablishmentSchema, UpdateEstablishmentSchema } from '../../../application/dtos/EstablishmentDTO';

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
     *     summary: List all establishments
     *     tags: [Establishments]
     *     responses:
     *       200:
     *         description: OK
     */
    public getAll = async (_req: Request, res: Response): Promise<void> => {
        const establishments = await this.listUseCase.execute();
        res.status(200).json({ success: true, data: establishments });
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
        const establishment = await this.getUseCase.execute(req.params.id);
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
    public update = async (req: Request, res: Response): Promise<void> => {
        const validatedData = UpdateEstablishmentSchema.parse(req.body);
        const establishment = await this.updateUseCase.execute(req.params.id, validatedData);
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
    public delete = async (req: Request, res: Response): Promise<void> => {
        await this.deleteUseCase.execute(req.params.id);
        res.status(204).send();
    };
}
