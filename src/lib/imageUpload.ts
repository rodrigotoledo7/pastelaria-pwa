import { supabase, isSupabaseConfigured } from './supabase';

export interface OptimizeImageResult {
  file: File;
  dataUrl: string;
}

/**
 * Converte um arquivo em Data URL (base64)
 */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Fallback para ambientes sem FileReader
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa !== 'undefined'
      ? btoa(binary)
      : typeof globalThis !== 'undefined' && 'Buffer' in globalThis
        ? (globalThis as unknown as { Buffer: { from: (b: ArrayBuffer) => { toString: (enc: string) => string } } })
            .Buffer.from(buffer)
            .toString('base64')
        : '';
  return `data:${file.type || 'image/jpeg'};base64,${base64}`;
}

/**
 * Redimensiona e otimiza uma imagem no browser usando Canvas para evitar payloads pesados.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<OptimizeImageResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const dataUrl = await fileToDataUrl(file);
    return { file, dataUrl };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const fallbackUrl = (e.target?.result as string) || '';
          resolve({ file, dataUrl: fallbackUrl });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, dataUrl });
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '');
            const optimizedFile = new File([blob], `${cleanName}.jpg`, {
              type: 'image/jpeg',
            });
            resolve({ file: optimizedFile, dataUrl });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        const fallbackUrl = (e.target?.result as string) || '';
        resolve({ file, dataUrl: fallbackUrl });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({ file, dataUrl: '' });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Faz upload da foto do produto para o Supabase Storage (bucket 'produtos') se disponível,
 * ou realiza fallback transparente para DataURL comprimido.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const { file: optimizedFile, dataUrl } = await optimizeImage(file);

  if (isSupabaseConfigured && supabase) {
    try {
      const ext = 'jpg';
      const cleanFileName = (file.name || 'foto')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const filePath = `produtos/${cleanFileName}-${uniqueSuffix}.${ext}`;

      const { data, error } = await supabase.storage
        .from('produtos')
        .upload(filePath, optimizedFile, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('produtos')
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload error, falling back to base64:', error.message);
      }
    } catch (err) {
      console.warn('Erro ao enviar imagem ao Supabase Storage, usando base64:', err);
    }
  }

  return dataUrl;
}
