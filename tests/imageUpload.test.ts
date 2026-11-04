import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileToDataUrl, optimizeImage, uploadProductImage } from '../src/lib/imageUpload';

describe('imageUpload utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converte um Blob/File em dataUrl com fileToDataUrl', async () => {
    const fakeContent = 'fake image content';
    const blob = new Blob([fakeContent], { type: 'image/jpeg' });
    const file = new File([blob], 'pastel.jpg', { type: 'image/jpeg' });

    const dataUrl = await fileToDataUrl(file);
    expect(dataUrl).toContain('data:image/jpeg;base64');
  });

  it('otimiza a imagem em ambiente sem DOM usando fallback', async () => {
    const fakeContent = 'fake image data for optimization';
    const blob = new Blob([fakeContent], { type: 'image/png' });
    const file = new File([blob], 'queijo.png', { type: 'image/png' });

    const result = await optimizeImage(file);
    expect(result.file).toBeDefined();
    expect(result.dataUrl).toContain('data:image/png;base64');
  });

  it('faz upload de imagem retornando fallback dataUrl quando Supabase não configurado', async () => {
    const fakeContent = 'sample data';
    const blob = new Blob([fakeContent], { type: 'image/jpeg' });
    const file = new File([blob], 'carne.jpg', { type: 'image/jpeg' });

    const url = await uploadProductImage(file);
    expect(url).toBeDefined();
    expect(url).toContain('data:image/jpeg;base64');
  });
});
