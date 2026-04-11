import { env } from '../config/env.config';
import { AppError } from '../http/errors/AppError';

const SIGHTENGINE_URL = 'https://api.sightengine.com/1.0/check.json';

const NUDITY_BLOCK_THRESHOLD = 0.5;
const GORE_BLOCK_THRESHOLD = 0.7;

interface SightengineResponse {
    status: string;
    nudity?: {
        raw: number;      // fully explicit content
        partial: number;  // partial nudity
        safe: number;     // safe
    };
    gore?: {
        prob: number;
    };
    error?: {
        type: string;
        message: string;
    };
}

export async function checkImageSafety(imageBuffer: Buffer, mimeType: string): Promise<void> {
    if (!env.SIGHTENGINE_API_USER || !env.SIGHTENGINE_API_SECRET) {
        console.warn('[Moderation] SIGHTENGINE credentials not set — skipping NSFW check');
        return;
    }

    const form = new FormData();
    form.append('api_user', env.SIGHTENGINE_API_USER);
    form.append('api_secret', env.SIGHTENGINE_API_SECRET);
    form.append('models', 'nudity,gore');
    // File extends Blob and is natively available in Node 18+
    form.append('media', new File([imageBuffer], 'upload', { type: mimeType }));

    let response: Response;
    try {
        response = await fetch(SIGHTENGINE_URL, { method: 'POST', body: form });
    } catch (err) {
        console.error('[Moderation] Network error contacting Sightengine:', err);
        return; // Fail open
    }

    const data = await response.json() as SightengineResponse;
    console.log('[Moderation] Sightengine response:', JSON.stringify(data));

    if (data.status !== 'success') {
        console.error('[Moderation] Sightengine error:', data.error?.message);
        return; // Fail open
    }

    const nudity = data.nudity;
    const gore = data.gore;

    if (
        (nudity && (nudity.raw >= NUDITY_BLOCK_THRESHOLD || nudity.partial >= NUDITY_BLOCK_THRESHOLD)) ||
        (gore && gore.prob >= GORE_BLOCK_THRESHOLD)
    ) {
        throw new AppError('La imagen fue rechazada por contener contenido inapropiado.', 422);
    }
}
