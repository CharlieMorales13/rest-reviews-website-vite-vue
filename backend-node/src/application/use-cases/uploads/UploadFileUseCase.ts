import { injectable, inject } from 'tsyringe';
import { IStorageService } from '../../../domain/services/IStorageService';
import { AppError } from '../../../infrastructure/http/errors/AppError';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class UploadFileUseCase {
    constructor(
        @inject('IStorageService') private storageService: IStorageService
    ) { }

    async execute(file: Buffer, originalName: string, bucketName: string, contentType: string): Promise<string> {
        if (!file) {
            throw new AppError('File is required', 400);
        }

        // Generate a unique file name to avoid collisions
        const parts = originalName.split('.');
        const extension = parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
        const fileName = `${uuidv4()}.${extension}`;

        return await this.storageService.uploadFile(file, fileName, bucketName, contentType);
    }
}
