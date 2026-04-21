import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { CreateEstablishmentUseCase } from "../../../application/use-cases/establishments/CreateEstablishmentUseCase";
import { ListEstablishmentsUseCase } from "../../../application/use-cases/establishments/ListEstablishmentsUseCase";
import { GetEstablishmentUseCase } from "../../../application/use-cases/establishments/GetEstablishmentUseCase";
import { UpdateEstablishmentUseCase } from "../../../application/use-cases/establishments/UpdateEstablishmentUseCase";
import { DeleteEstablishmentUseCase } from "../../../application/use-cases/establishments/DeleteEstablishmentUseCase";
import {
  CreateEstablishmentSchema,
  UpdateEstablishmentSchema,
} from "../../../application/dtos/EstablishmentDTO";
import { AuthRequest } from "../middlewares/AuthMiddleware";

@injectable()
export class EstablishmentController {
  constructor(
    @inject(CreateEstablishmentUseCase)
    private createUseCase: CreateEstablishmentUseCase,
    @inject(ListEstablishmentsUseCase)
    private listUseCase: ListEstablishmentsUseCase,
    @inject(GetEstablishmentUseCase)
    private getUseCase: GetEstablishmentUseCase,
    @inject(UpdateEstablishmentUseCase)
    private updateUseCase: UpdateEstablishmentUseCase,
    @inject(DeleteEstablishmentUseCase)
    private deleteUseCase: DeleteEstablishmentUseCase,
  ) {}

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
    const e = await this.createUseCase.execute(validatedData);
    res.status(201).json({
      success: true,
      data: {
        id: e.id,
        slug: e.slug,
        name: e.name,
        description: e.description,
        category: e.category,
        managerId: e.managerId,
        isActive: e.isActive,
      },
    });
  };

  /**
   * @swagger
   * /establishments:
   *   get:
   *     summary: List all campus establishments (max ~10, no pagination needed)
   *     tags: [Establishments]
   *     responses:
   *       200:
   *         description: Array of all establishments
   */
  public getOne = async (req: Request, res: Response): Promise<void> => {
    const slug = req.params.slug as string;
    const e = await this.getUseCase.execute(slug);
    res.status(200).json({
      success: true,
      data: {
        id: e.id,
        slug: e.slug,
        name: e.name,
        description: e.description,
        category: e.category,
        managerId: e.managerId,
        isActive: e.isActive,
        locationDetails: e.locationDetails,
        openingHours: e.openingHours,
        galleryUrls: e.galleryUrls,
        menuUrls: e.menuUrls,
        logoUrl: e.logoUrl,
        coverUrl: e.coverUrl,
        createdAt: e.createdAt,
      },
    });
  };

  public getAll = async (_req: Request, res: Response): Promise<void> => {
    const { data } = await this.listUseCase.execute();
    const mapped = data.map((e) => ({
      id: e.id,
      slug: e.slug,
      name: e.name,
      description: e.description,
      category: e.category,
      managerId: e.managerId,
      isActive: e.isActive,
      locationDetails: e.locationDetails,
      openingHours: e.openingHours,
      galleryUrls: e.galleryUrls,
      menuUrls: e.menuUrls,
      logoUrl: e.logoUrl,
      coverUrl: e.coverUrl,
      createdAt: e.createdAt,
    }));
    res.status(200).json({ success: true, data: mapped });
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

    const establishment = await this.updateUseCase.execute(
      id,
      validatedData,
      user
        ? {
            id: user.userId,
            role: user.role,
          }
        : undefined,
    );

    res.status(200).json({
      success: true,
      data: {
        id: establishment.id,
        name: establishment.name,
        description: establishment.description,
        category: establishment.category,
        managerId: establishment.managerId,
        isActive: establishment.isActive,
      },
    });
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

    await this.deleteUseCase.execute(
      id,
      user
        ? {
            id: user.userId,
            role: user.role,
          }
        : undefined,
    );

    res.status(204).send();
  };
}
