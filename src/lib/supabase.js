// src/lib/supabase.js
// Supabase Client + API Functions for SuperAdmin
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
// SUPERADMINS (Login)
// ============================================

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

export async function getRsvpsByProject(projectId) {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return { data, error };
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

export default supabase;
