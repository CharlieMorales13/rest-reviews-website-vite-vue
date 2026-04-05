import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { ListUsersUseCase } from '../../../application/use-cases/users/ListUsersUseCase';
import { GetUserUseCase } from '../../../application/use-cases/users/GetUserUseCase';
import { UpdateUserUseCase } from '../../../application/use-cases/users/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../../application/use-cases/users/DeleteUserUseCase';
import { GetUserProfileUseCase } from '../../../application/use-cases/users/GetUserProfileUseCase';
import { AdminCreateUserUseCase } from '../../../application/use-cases/users/AdminCreateUserUseCase';
import { AdminCreateUserSchema, UpdateUserSchema } from '../../../application/dtos/UserDTO';
import { createPaginatedResponse } from '../utils/Pagination';

@injectable()
export class UserController {
    constructor(
        @inject(ListUsersUseCase) private listUsersUseCase: ListUsersUseCase,
        @inject(GetUserUseCase) private getUserUseCase: GetUserUseCase,
        @inject(UpdateUserUseCase) private updateUserUseCase: UpdateUserUseCase,
        @inject(DeleteUserUseCase) private deleteUserUseCase: DeleteUserUseCase,
        @inject(GetUserProfileUseCase) private getUserProfileUseCase: GetUserProfileUseCase,
        @inject(AdminCreateUserUseCase) private adminCreateUserUseCase: AdminCreateUserUseCase,
    ) { }

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: List all users with pagination (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *     responses:
     *       200:
     *         description: List of users
     */
    public getAll = async (req: Request, res: Response): Promise<void> => {
        const { page, limit } = req.query;
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;

        const { data, total } = await this.listUsersUseCase.execute({ page: pageNum, limit: limitNum });

        const formatted = data.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            createdAt: u.createdAt
        }));

        res.status(200).json(
            createPaginatedResponse(formatted, total, pageNum, limitNum)
        );
    };

    /**
     * @swagger
     * /users/{id}:
     *   get:
     *     summary: Get user details (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User details
     */
    public getById = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const user = await this.getUserUseCase.execute(id);
        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });
    };

    /**
     * @swagger
     * /users/{id}:
     *   put:
     *     summary: Update user details (Admin only)
     *     tags: [Users]
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
     *             $ref: '#/components/schemas/UpdateUserInput'
     *     responses:
     *       200:
     *         description: User updated successfully
     */
    public update = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const validatedData = UpdateUserSchema.parse(req.body);
        const user = await this.updateUserUseCase.execute(id, validatedData);
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    };

    /**
     * @swagger
     * /users/{id}:
     *   delete:
     *     summary: Delete a user (Admin only)
     *     tags: [Users]
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
     *         description: User deleted
     */
    public delete = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        await this.deleteUserUseCase.execute(id);
        res.status(204).send();
    };

    /**
     * @swagger
     * /users/{id}/profile:
     *   get:
     *     summary: Get public user profile and activity
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Public profile data
     */
    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Create a new user account (Admin only)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name, email, password, role]
     *             properties:
     *               name:
     *                 type: string
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *               role:
     *                 type: string
     *                 enum: [student, manager, admin]
     *     responses:
     *       201:
     *         description: User created successfully
     */
    public create = async (req: Request, res: Response): Promise<void> => {
        const dto = AdminCreateUserSchema.parse(req.body);
        const user = await this.adminCreateUserUseCase.execute(dto);
        res.status(201).json({ success: true, data: user });
    };

    public getProfile = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const profile = await this.getUserProfileUseCase.execute(id);
        res.status(200).json({
            success: true,
            data: profile
        });
    };
}
