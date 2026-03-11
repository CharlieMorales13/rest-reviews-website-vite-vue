export interface IStorageService {
    uploadFile(file: Buffer, fileName: string, bucketName: string, contentType: string): Promise<string>;
    deleteFile(fileName: string, bucketName: string): Promise<void>;
}
