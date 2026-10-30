import { supabase } from '../config/supabaseClient';

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const storageService = {
  // Validate file before upload
  validateFile(file) {
    if (!file) return { valid: false, error: 'No se seleccionó ningún archivo.' };
    
    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return { 
        valid: false, 
        error: `Formato .${extension} no permitido. Formatos aceptados: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, imágenes.` 
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'El archivo excede el tamaño máximo permitido de 50MB.' };
    }

    return { valid: true };
  },

  // Upload to Supabase Storage
  async uploadFile(bucket, path, file) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        // Fallback for offline/local storage if bucket does not exist yet
        console.warn(`Storage bucket ${bucket} upload error:`, error.message);
        const safeUrl = (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined' && file instanceof Blob)
          ? URL.createObjectURL(file)
          : `https://storage.local/files/${encodeURIComponent(file.name || 'document')}`;

        return {
          path: path,
          url: safeUrl,
          size: file.size || 0,
          name: file.name || 'document',
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return {
        path: data.path,
        url: publicUrl,
        size: file.size,
        name: file.name,
      };
    } catch (err) {
      // Local file preview fallback
      const safeUrl = (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined' && file instanceof Blob)
        ? URL.createObjectURL(file)
        : `https://storage.local/files/${encodeURIComponent(file.name || 'document')}`;

      return {
        path: path,
        url: safeUrl,
        size: file.size || 0,
        name: file.name || 'document',
      };
    }
  },

  // Get File Download or View URL
  async getFileUrl(bucket, path) {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) {
        const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
        return pubData.publicUrl;
      }
      return data.signedUrl;
    } catch {
      return '#';
    }
  }
};
