import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkImageSafety } from '@/infrastructure/services/VisionModerationService';
import { AppError } from '@/infrastructure/http/errors/AppError';

// Stub env so credentials are always "set" for these tests
vi.mock('@/infrastructure/config/env.config', () => ({
    env: {
        SIGHTENGINE_API_USER: 'test_user',
        SIGHTENGINE_API_SECRET: 'test_secret',
    },
}));

const fakeBuffer = Buffer.from('fake-image-data');

function mockFetch(body: object, ok = true) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok,
        json: () => Promise.resolve(body),
    }));
}

beforeEach(() => {
    vi.unstubAllGlobals();
});

describe('checkImageSafety', () => {
    it('permite imagen limpia', async () => {
        mockFetch({
            status: 'success',
            nudity: { raw: 0.01, partial: 0.02 },
            gore: { prob: 0.01 },
        });

        await expect(checkImageSafety(fakeBuffer, 'image/jpeg')).resolves.toBeUndefined();
    });

    it('rechaza imagen con contenido sexual explícito', async () => {
        mockFetch({
            status: 'success',
            nudity: { raw: 0.95, partial: 0.90 },
            gore: { prob: 0.01 },
        });

        await expect(checkImageSafety(fakeBuffer, 'image/jpeg')).rejects.toThrow(AppError);
    });

    it('rechaza imagen con gore', async () => {
        mockFetch({
            status: 'success',
            nudity: { raw: 0.01, partial: 0.01 },
            gore: { prob: 0.85 },
        });

        await expect(checkImageSafety(fakeBuffer, 'image/jpeg')).rejects.toThrow(AppError);
    });

    it('permite si la API devuelve error (fail open)', async () => {
        mockFetch({ status: 'failure', error: { type: 'unauthorized', message: 'bad key' } });

        await expect(checkImageSafety(fakeBuffer, 'image/jpeg')).resolves.toBeUndefined();
    });

    it('permite si fetch lanza excepción de red (fail open)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        await expect(checkImageSafety(fakeBuffer, 'image/jpeg')).resolves.toBeUndefined();
    });
});
