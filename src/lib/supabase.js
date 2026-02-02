// src/lib/supabase.js
// Supabase Client + ALL API Functions for SuperAdmin
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
  try {
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: requests } = await supabase.from('contact_requests').select('*');
    
    const projectList = projects || [];
    const requestList = requests || [];
    
    return {
      data: {
        totalProjects: projectList.length,
        liveProjects: projectList.filter(p => p.status === 'live').length,
        inProgressProjects: projectList.filter(p => ['inquiry', 'in_progress', 'std'].includes(p.status)).length,
        totalRevenue: projectList.reduce((sum, p) => sum + (p.total_price || 0), 0),
        pendingRequests: requestList.filter(r => r.status === 'new' || r.status === 'pending').length,
        recentProjects: projectList.slice(0, 5),
        recentRequests: requestList.slice(0, 5),
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

// ============================================
// PROJECTS
// ============================================

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

export async function getProjectBySlug(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();
  return { data, error };
}

export async function createProject(projectData) {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();
  return { data, error };
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  return { error };
}

// ============================================
// CONTACT REQUESTS
// ============================================

export async function getContactRequests() {
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getContactRequestById(id) {
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

export async function createContactRequest(requestData) {
  const { data, error } = await supabase
    .from('contact_requests')
    .insert([requestData])
    .select()
    .single();
  return { data, error };
}

export async function updateContactRequest(id, updates) {
  const { data, error } = await supabase
    .from('contact_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteContactRequest(id) {
  const { error } = await supabase
    .from('contact_requests')
    .delete()
    .eq('id', id);
  return { error };
}

// ============================================
// SUPERADMINS (Login)
// ============================================

export async function getSuperadmins() {
  const { data, error } = await supabase
    .from('superadmins')
    .select('*');
  return { data, error };
}

export async function getSuperadminByEmail(email) {
  const { data, error } = await supabase
    .from('superadmins')
    .select('*')
    .eq('email', email)
    .single();
  return { data, error };
}

// ============================================
// RSVP
// ============================================

export async function getRsvps() {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getRsvpsByProject(projectId) {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createRsvp(rsvpData) {
  const { data, error } = await supabase
    .from('rsvps')
    .insert([rsvpData])
    .select()
    .single();
  return { data, error };
}

export async function updateRsvp(id, updates) {
  const { data, error } = await supabase
    .from('rsvps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteRsvp(id) {
  const { error } = await supabase
    .from('rsvps')
    .delete()
    .eq('id', id);
  return { error };
}

// ============================================
// CONTENT
// ============================================

export async function getContentByProject(projectId) {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('project_id', projectId)
    .single();
  return { data, error };
}

export async function updateContent(projectId, updates) {
  const { data, error } = await supabase
    .from('content')
    .upsert({ project_id: projectId, ...updates })
    .select()
    .single();
  return { data, error };
}

// ============================================
// PHOTOS
// ============================================

export async function getPhotosByProject(projectId) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function uploadPhoto(file, projectId) {
  const fileName = `${projectId}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, file);
  return { data, error };
}

export async function deletePhoto(id) {
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', id);
  return { error };
}

// ============================================
// EMAIL LOGS
// ============================================

export async function getEmailLogs(projectId = null) {
  let query = supabase
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getEmailLogById(id) {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
}

export async function createEmailLog(logData) {
  const { data, error } = await supabase
    .from('email_logs')
    .insert([logData])
    .select()
    .single();
  return { data, error };
}

// ============================================
// PASSWORD RESET
// ============================================

export async function createPasswordResetToken(projectId, email, token, expiresAt) {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .insert([{
      project_id: projectId,
      email,
      token,
      expires_at: expiresAt,
    }])
    .select()
    .single();
  return { data, error };
}

export async function getPasswordResetToken(token) {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();
  return { data, error };
}

export async function markTokenAsUsed(tokenId) {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenId);
  return { data, error };
}

// ============================================
// AUTOMATIC STATUS SYNC
// ============================================

/**
 * Prüft alle Projekte und aktualisiert deren Status basierend auf den Daten:
 * - std_until: Wenn heute > std_until → Status wird "live"
 * - archive_from: Wenn heute > archive_from → Status wird "archiv"
 * 
 * Die Daten kommen aus content.status (std_until, archive_from)
 * oder aus dem project direkt (falls dort gespeichert)
 */
export async function syncAllProjectStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const results = {
    checked: 0,
    updated: 0,
    errors: [],
    changes: []
  };
  
  try {
    // Alle Projekte mit Content laden
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, slug, status, wedding_date, partner1_name, partner2_name');
    
    if (projectsError) throw projectsError;
    
    for (const project of projects || []) {
      results.checked++;
      
      // Content für dieses Projekt laden (dort sind std_until und archive_from)
      const { data: contentData } = await supabase
        .from('content')
        .select('status')
        .eq('project_id', project.id)
        .single();
      
      const statusData = contentData?.status || {};
      const stdUntil = statusData.std_until ? new Date(statusData.std_until) : null;
      const archiveFrom = statusData.archive_from ? new Date(statusData.archive_from) : null;
      
      let newStatus = project.status;
      let reason = '';
      
      // Logik: Archive hat Priorität über Live
      if (archiveFrom && today >= archiveFrom) {
        if (project.status !== 'archiv') {
          newStatus = 'archiv';
          reason = `Archiv-Datum erreicht (${statusData.archive_from})`;
        }
      } else if (stdUntil && today >= stdUntil) {
        // STD-Ende erreicht → Live (aber nur wenn nicht schon archiv)
        if (project.status === 'std') {
          newStatus = 'live';
          reason = `STD-Ende erreicht (${statusData.std_until})`;
        }
      }
      
      // Status updaten wenn geändert
      if (newStatus !== project.status) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ status: newStatus })
          .eq('id', project.id);
        
        if (updateError) {
          results.errors.push({ project: project.slug, error: updateError.message });
        } else {
          results.updated++;
          results.changes.push({
            project: project.slug,
            names: `${project.partner1_name} & ${project.partner2_name}`,
            from: project.status,
            to: newStatus,
            reason
          });
        }
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message, results };
  }
}

/**
 * Prüft ein einzelnes Projekt und gibt den empfohlenen Status zurück
 */
export async function checkProjectStatus(projectId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: project } = await supabase
    .from('projects')
    .select('status, wedding_date')
    .eq('id', projectId)
    .single();
  
  const { data: contentData } = await supabase
    .from('content')
    .select('status')
    .eq('project_id', projectId)
    .single();
  
  const statusData = contentData?.status || {};
  const stdUntil = statusData.std_until ? new Date(statusData.std_until) : null;
  const archiveFrom = statusData.archive_from ? new Date(statusData.archive_from) : null;
  
  let recommendedStatus = project?.status || 'std';
  let reason = 'Keine automatische Änderung';
  
  if (archiveFrom && today >= archiveFrom) {
    recommendedStatus = 'archiv';
    reason = `Archiv-Datum (${statusData.archive_from}) erreicht`;
  } else if (stdUntil && today >= stdUntil) {
    recommendedStatus = 'live';
    reason = `STD-Ende (${statusData.std_until}) erreicht`;
  }
  
  return {
    currentStatus: project?.status,
    recommendedStatus,
    shouldUpdate: project?.status !== recommendedStatus,
    reason,
    dates: {
      stdUntil: statusData.std_until,
      archiveFrom: statusData.archive_from,
      weddingDate: project?.wedding_date
    }
  };
}


export default supabase;
