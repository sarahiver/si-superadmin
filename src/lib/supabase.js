// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wikxhpvikelfgzdgndlf.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpa3hocHZpa2VsZmd6ZGduZGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MDYyNTMsImV4cCI6MjA1MjE4MjI1M30.lMkKN6R7BBLJMqNVQqTs2PNY6cRxyb6WLBpCuLwNSJc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// AUTH
// ============================================
export async function verifyAdminLogin(username, password) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('username', username)
      .single();

    if (error || !data) {
      return { success: false, error: 'Ungültige Anmeldedaten' };
    }

    const inputHash = await hashPassword(password);
    const isValid = inputHash === data.password_hash;

    return { success: isValid, error: isValid ? null : 'Ungültige Anmeldedaten' };
  } catch (err) {
    console.error('Auth error:', err);
    return { success: false, error: 'Verbindungsfehler' };
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// PROJECTS
// ============================================
export async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
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
    .insert(projectData)
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
  return { data: data || [], error };
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
// STATS
// ============================================
export async function getDashboardStats() {
  const [projectsRes, requestsRes] = await Promise.all([
    supabase.from('projects').select('id, status, created_at'),
    supabase.from('contact_requests').select('id, status, created_at'),
  ]);

  const projects = projectsRes.data || [];
  const requests = requestsRes.data || [];

  return {
    totalProjects: projects.length,
    liveProjects: projects.filter(p => p.status === 'live').length,
    stdProjects: projects.filter(p => p.status === 'std').length,
    archivProjects: projects.filter(p => p.status === 'archiv').length,
    totalRequests: requests.length,
    newRequests: requests.filter(r => r.status === 'new' || !r.status).length,
  };
}
