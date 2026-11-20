import { File } from 'expo-file-system';
import { supabase } from '@/core/config/supabase';

export async function subirEvidenciaMultimedia(params: {
  uri: string;
  tipo: 'image' | 'video';
}): Promise<string | null> {
  try {
    const extension = params.tipo === 'video' ? 'mp4' : 'jpg';
    const contentType = params.tipo === 'video' ? 'video/mp4' : 'image/jpeg';
    const nombreArchivo = `alerta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${extension}`;

    // Lee los bytes reales del archivo local en Android/iOS usando expo-file-system
    const archivoLocal = new File(params.uri);
    const arrayBuffer = await archivoLocal.arrayBuffer();

    const { error } = await supabase.storage
      .from('evidencias-alertas')
      .upload(nombreArchivo, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo evidencia:', error.message);
      return null;
    }

    const { data } = supabase.storage
      .from('evidencias-alertas')
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  } catch (err) {
    console.error('Fallo inesperado al subir evidencia:', err);
    return null;
  }
}