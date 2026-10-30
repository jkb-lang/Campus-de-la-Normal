import { supabase } from '../config/supabaseClient';
import { storageService } from './storageService';

export const materialService = {
  // Get folders for a subject
  async getFolders(subjectId) {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('subject_id', subjectId)
        .order('name');
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`folders_${subjectId}`) || '[]');
      return local;
    }
  },

  // Create folder
  async createFolder(subjectId, name, parentId = null, userId = null) {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          subject_id: subjectId,
          name,
          parent_id: parentId,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const folders = await this.getFolders(subjectId);
      const newFolder = {
        id: 'fld-' + Date.now(),
        subject_id: subjectId,
        name,
        parent_id: parentId,
        created_by: userId,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`folders_${subjectId}`, JSON.stringify([...folders, newFolder]));
      return newFolder;
    }
  },

  // Get materials for a subject (docente sees all, alumno only 'published')
  async getMaterials(subjectId, isStudent = false) {
    try {
      let query = supabase
        .from('materials')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

      if (isStudent) {
        query = query.eq('publication_status', 'published');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`materials_${subjectId}`) || '[]');
      if (isStudent) {
        return local.filter((m) => m.publication_status === 'published');
      }
      return local;
    }
  },

  // Upload and register new material
  async uploadMaterial(subjectId, teacherId, file, metadata) {
    // 1. Upload physical file to storage
    const storagePath = `${subjectId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const uploadRes = await storageService.uploadFile('course-materials', storagePath, file);

    const resourceType = this.detectResourceType(file.name);

    const materialRecord = {
      title: metadata.title || file.name,
      description: metadata.description || '',
      subject_id: subjectId,
      folder_id: metadata.folder_id || null,
      unit_number: metadata.unit_number ? parseInt(metadata.unit_number) : null,
      unit_title: metadata.unit_title || '',
      resource_type: resourceType,
      file_url: uploadRes.url,
      file_path: uploadRes.path,
      file_size: uploadRes.size,
      file_name: uploadRes.name,
      mime_type: file.type || 'application/octet-stream',
      publication_status: metadata.publication_status || 'published',
      teacher_id: teacherId,
      version: 1,
    };

    try {
      const { data, error } = await supabase
        .from('materials')
        .insert(materialRecord)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const all = await this.getMaterials(subjectId, false);
      const newMat = {
        ...materialRecord,
        id: 'mat-' + Date.now(),
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(`materials_${subjectId}`, JSON.stringify([newMat, ...all]));
      return newMat;
    }
  },

  // Update material metadata or publication status
  async updateMaterial(subjectId, materialId, updates) {
    try {
      const { data, error } = await supabase
        .from('materials')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', materialId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const all = await this.getMaterials(subjectId, false);
      const updated = all.map((m) => (m.id === materialId ? { ...m, ...updates, updated_at: new Date().toISOString() } : m));
      localStorage.setItem(`materials_${subjectId}`, JSON.stringify(updated));
      return updated.find((m) => m.id === materialId);
    }
  },

  // Delete material
  async deleteMaterial(subjectId, materialId) {
    try {
      await supabase.from('materials').delete().eq('id', materialId);
    } catch {
      const all = await this.getMaterials(subjectId, false);
      const filtered = all.filter((m) => m.id !== materialId);
      localStorage.setItem(`materials_${subjectId}`, JSON.stringify(filtered));
    }
    return true;
  },

  // Helper to detect resource type by filename extension
  detectResourceType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx', 'odt'].includes(ext)) return 'doc';
    if (['ppt', 'pptx', 'odp'].includes(ext)) return 'slides';
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'sheet';
    if (['txt', 'md', 'rtf'].includes(ext)) return 'text';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
    return 'other';
  }
};
