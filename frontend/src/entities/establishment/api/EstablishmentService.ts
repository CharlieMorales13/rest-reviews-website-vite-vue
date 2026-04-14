import { httpClient } from '@/shared/api/httpClient';

export interface UpdateEstablishmentDTO {
  name?: string;
  description?: string | null;
  locationDetails?: string | null;
  openingHours?: string | null;
  galleryUrls?: string[];
  menuUrls?: string[];
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export class EstablishmentService {
  static async update(id: string, dto: UpdateEstablishmentDTO): Promise<void> {
    await httpClient.put(`/api/establishments/${id}`, dto);
  }
}
