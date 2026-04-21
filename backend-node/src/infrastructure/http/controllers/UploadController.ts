import { Response, Request } from "express";
import { injectable, inject } from "tsyringe";
import { UploadFileUseCase } from "../../../application/use-cases/uploads/UploadFileUseCase";
import { AppError } from "../errors/AppError";
import { checkImageSafety } from "../../services/VisionModerationService";

@injectable()
export class UploadController {
  constructor(
    @inject(UploadFileUseCase) private uploadUseCase: UploadFileUseCase,
  ) {}

  /**
   * @swagger
   * /upload:
   *   post:
   *     summary: Upload an image file
   *     tags: [Uploads]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               bucket:
   *                 type: string
   *                 example: 'reviews-app-bucket'
   *     responses:
   *       201:
   *         description: File uploaded successfully
   */
  public uploadFile = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
      throw new AppError("No file provided", 400);
    }

    // Reject NSFW images before uploading to storage
    await checkImageSafety(file.buffer, file.mimetype);

    const bucketName = "reviews-app-bucket";

    const publicUrl = await this.uploadUseCase.execute(
      file.buffer,
      file.originalname,
      bucketName,
      file.mimetype,
    );

    res.status(201).json({
      success: true,
      data: {
        url: publicUrl,
      },
    });
  };
}
