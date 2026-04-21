import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.config";
import { IStorageService } from "../../domain/services/IStorageService";
import { injectable } from "tsyringe";
import { AppError } from "../http/errors/AppError";

@injectable()
export class SupabaseStorageService implements IStorageService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    bucketName: string,
    contentType: string,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new AppError(`Error uploading to Supabase: ${error.message}`, 500);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async deleteFile(fileName: string, bucketName: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      throw new AppError(`Error deleting from Supabase: ${error.message}`, 500);
    }
  }
}
