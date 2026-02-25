// src/lib/supabase.js
// API-Proxy Version: Alle DB-Operationen laufen über /api/db (service_role serverseitig)
// Kein Supabase-Client mehr im Frontend — kein anon Key nötig!

import { adminFetch } from './apiClient';

// ─── Zentraler DB-Call ───
async function db(body) {
  const res = await adminFetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    return { data: null, error: { message: json.error || 'API Error' } };
  }
  return { data: json.data, error: null };
}

// ─── Supabase-kompatibles Proxy-Objekt ───
// Für Pages die `supabase.from('table')...` direkt nutzen
function createQueryBuilder(table) {
  let _select = '*';
  let _filters = [];
  let _order = null;
  let _limit = null;
  let _single = false;
  let _maybeSingle = false;
  let _data = undefined;
  let _action = 'select';
  let _upsertOpts = null;

  const builder = {
    select(columns = '*') { _select = columns; return builder; },
    eq(col, val)    { _filters.push({ op: 'eq', column: col, value: val }); return builder; },
    neq(col, val)   { _filters.push({ op: 'neq', column: col, value: val }); return builder; },
    gt(col, val)    { _filters.push({ op: 'gt', column: col, value: val }); return builder; },
    gte(col, val)   { _filters.push({ op: 'gte', column: col, value: val }); return builder; },
    lt(col, val)    { _filters.push({ op: 'lt', column: col, value: val }); return builder; },
    lte(col, val)   { _filters.push({ op: 'lte', column: col, value: val }); return builder; },
    like(col, val)  { _filters.push({ op: 'like', column: col, value: val }); return builder; },
    ilike(col, val) { _filters.push({ op: 'ilike', column: col, value: val }); return builder; },
    is(col, val)    { _filters.push({ op: 'is', column: col, value: val }); return builder; },
    in(col, val)    { _filters.push({ op: 'in', column: col, value: val }); return builder; },
    not(col, op2, val) { _filters.push({ op: 'not', column: col, op2, value: val }); return builder; },
    order(col, opts = {}) { _order = { column: col, ascending: opts.ascending ?? false }; return builder; },
    limit(n)        { _limit = n; return builder; },

    single() {
      _single = true;
      return builder;
    },

    maybeSingle() {
      _maybeSingle = true;
      return builder;
    },

    insert(rows) {
      _data = rows;
      _action = 'insert';
      return builder;
    },

    update(data) {
      _data = data;
      _action = 'update';
      return builder;
    },

    upsert(data, opts) {
      _data = data;
      _action = 'upsert';
      _upsertOpts = opts;
      return builder;
    },

    delete() {
      _action = 'delete';
      return builder;
    },

    // Thenable — damit await supabase.from('x').select() funktioniert
    then(resolve, reject) {
      return builder._execute().then(resolve, reject);
    },

    async _execute() {
      const body = {
        action: _action,
        table,
        filters: _filters.length ? _filters : undefined,
        options: {},
      };

      if (_select !== '*') body.options.select = _select;
      if (_order) body.options.order = _order;
      if (_limit) body.options.limit = _limit;
      if (_single) body.options.single = true;
      if (_maybeSingle) body.options.maybeSingle = true;
      if (_upsertOpts?.onConflict) body.options.onConflict = _upsertOpts.onConflict;

      if (_data !== undefined) {
        body.data = _data;
      }

      return db(body);
    },
  };

  return builder;
}

// Proxy-Objekt das sich wie der Supabase-Client verhält
export const supabase = {
  from(table) {
    return createQueryBuilder(table);
  },
  async rpc(fn, args) {
    return db({ action: 'rpc', fn, args });
  },
};

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
  try {
    const [projectsRes, requestsRes] = await Promise.all([
      db({ action: 'select', table: 'projects', options: { select: '*' } }),
      db({ action: 'select', table: 'contact_requests', options: { select: '*' } }),
    ]);

    const projectList = projectsRes.data || [];
    const requestList = requestsRes.data || [];

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
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

// ============================================
// PROJECTS
// ============================================

export async function getProjects() {
  return db({
    action: 'select', table: 'projects',
    options: { select: '*', order: { column: 'created_at', ascending: false } },
  });
}

export async function getProjectById(id) {
  return db({
    action: 'select', table: 'projects',
    filters: [{ op: 'eq', column: 'id', value: id }],
    options: { select: '*', single: true },
  });
}

export async function getProjectBySlug(slug) {
  return db({
    action: 'select', table: 'projects',
    filters: [{ op: 'eq', column: 'slug', value: slug }],
    options: { select: '*', single: true },
  });
}

export async function createProject(projectData) {
  return db({ action: 'insert', table: 'projects', data: [projectData], options: { single: true } });
}

export async function updateProject(id, updates) {
  return db({
    action: 'update', table: 'projects', data: updates,
    filters: [{ op: 'eq', column: 'id', value: id }],
    options: { single: true },
  });
}

export async function deleteProject(id) {
  return db({ action: 'delete', table: 'projects', filters: [{ op: 'eq', column: 'id', value: id }] });
}

// ============================================
// CONTACT REQUESTS
// ============================================

export async function getContactRequests() {
  return db({
    action: 'select', table: 'contact_requests',
    options: { select: '*', order: { column: 'created_at', ascending: false } },
  });
}

export async function getContactRequestById(id) {
  return db({
    action: 'select', table: 'contact_requests',
    filters: [{ op: 'eq', column: 'id', value: id }],
    options: { select: '*', single: true },
  });
}

export async function createContactRequest(requestData) {
  return db({ action: 'insert', table: 'contact_requests', data: [requestData], options: { single: true } });
}

export async function updateContactRequest(id, updates) {
  return db({
    action: 'update', table: 'contact_requests', data: updates,
    filters: [{ op: 'eq', column: 'id', value: id }],
    options: { single: true },
  });
}

export async function deleteContactRequest(id) {
  return db({ action: 'delete', table: 'contact_requests', filters: [{ op: 'eq', column: 'id', value: id }] });
}

// ============================================
// SUPERADMINS
// ============================================

export async function getSuperadmins() {
  return db({ action: 'select', table: 'superadmins', options: { select: '*' } });
}

export async function getSuperadminByEmail(email) {
  return db({
    action: 'select', table: 'superadmins',
    filters: [{ op: 'eq', column: 'email', value: email }],
    options: { select: '*', single: true },
  });
}

// ============================================
// RSVP
// ============================================

export async function getRsvps() {
  return db({
    action: 'select', table: 'rsvp_responses',
    options: { select: '*', order: { column: 'created_at', ascending: false } },
  });
}

export async function getRsvpsByProject(projectId) {
  return db({
    action: 'select', table: 'rsvp_responses',
    filters: [{ op: 'eq', column: 'project_id', value: projectId }],
    options: { select: '*', order: { column: 'created_at', ascending: false } },
  });
}

export async function createRsvp(rsvpData) {
  return db({ action: 'insert', table: 'rsvp_responses', data: [rsvpData], options: { single: true } });
}

export async function updateRsvp(id, updates) {
  return db({
    action: 'update', table: 'rsvp_responses', data: updates,
    filters: [{ op: 'eq', column: 'id', value: id }],
    options: { single: true },
  });
}

export async function deleteRsvp(id) {
  return db({ action: 'delete', table: 'rsvp_responses', filters: [{ op: 'eq', column: 'id', value: id }] });
}

// ============================================
// CONTENT
// ============================================

export async function getContentByProject(projectId) {
  return db({
    action: 'select', table: 'project_content',
    filters: [{ op: 'eq', column: 'project_id', value: projectId }],
    options: { select: '*', single: true },
  });
}

export async function updateContent(projectId, updates) {
  return db({
    action: 'upsert', table: 'project_content',
    data: { project_id: projectId, ...updates },
    options: { single: true },
  });
}

// ============================================
// PHOTOS
// ============================================

export async function getPhotosByProject(projectId) {
  return db({
    action: 'select', table: 'photo_uploads',
    filters: [{ op: 'eq', column: 'project_id', value: projectId }],
    options: { select: '*', order: { column: 'created_at', ascending: false } },
  });
}

export async function deletePhoto(id) {
  return db({ action: 'delete', table: 'photo_uploads', filters: [{ op: 'eq', column: 'id', value: id }] });
}

// ============================================
// EMAIL LOGS
// ============================================

export async function getEmailLogs(projectId = null) {
  const body = {
    action: 'select', table: 'email_logs',
    options: { select: '*', order: { column: 'created_at', ascending: false } },
  };
  if (projectId) body.filters = [{ op: 'eq', column: 'project_id', value: projectId }];
  return db(body);
}

export async function getEmailLogById(id) {
  return db({
    action: 'select', table: 'email_logs',
    filters: [{ op: 'eq', column: 'id', value: id }],
    options: { select: '*', single: true },
  });
}

export async function createEmailLog(logData) {
  return db({ action: 'insert', table: 'email_logs', data: [logData], options: { single: true } });
}

// ============================================
// PASSWORD RESET
// ============================================

export async function createPasswordResetToken(projectId, email, token, expiresAt) {
  return db({
    action: 'insert', table: 'password_reset_tokens',
    data: [{ project_id: projectId, email, token, expires_at: expiresAt }],
    options: { single: true },
  });
}

export async function getPasswordResetToken(token) {
  return db({
    action: 'select', table: 'password_reset_tokens',
    filters: [
      { op: 'eq', column: 'token', value: token },
      { op: 'is', column: 'used_at', value: null },
      { op: 'gt', column: 'expires_at', value: new Date().toISOString() },
    ],
    options: { select: '*', single: true },
  });
}

export async function markTokenAsUsed(tokenId) {
  return db({
    action: 'update', table: 'password_reset_tokens',
    data: { used_at: new Date().toISOString() },
    filters: [{ op: 'eq', column: 'id', value: tokenId }],
  });
}

// ============================================
// AUTOMATIC STATUS SYNC
// ============================================

export async function syncAllProjectStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results = { checked: 0, updated: 0, errors: [], changes: [] };

  try {
    const { data: projects, error: projectsError } = await db({
      action: 'select', table: 'projects',
      options: { select: 'id, slug, status, wedding_date, partner1_name, partner2_name, std_date, archive_date' },
    });
    if (projectsError) throw projectsError;

    for (const project of projects || []) {
      results.checked++;
      const stdDate = project.std_date ? new Date(project.std_date) : null;
      const archiveDate = project.archive_date ? new Date(project.archive_date) : null;
      let newStatus = project.status;
      let reason = '';

      if (archiveDate && today >= archiveDate) {
        if (project.status !== 'archive') { newStatus = 'archive'; reason = `Archiv-Datum erreicht (${project.archive_date})`; }
      } else if (stdDate && today >= stdDate) {
        if (project.status === 'std') { newStatus = 'live'; reason = `STD-Ende erreicht (${project.std_date})`; }
      }

      if (newStatus !== project.status) {
        const { error: updateError } = await db({
          action: 'update', table: 'projects', data: { status: newStatus },
          filters: [{ op: 'eq', column: 'id', value: project.id }],
        });
        if (updateError) {
          results.errors.push({ project: project.slug, error: updateError.message });
        } else {
          results.updated++;
          results.changes.push({
            project: project.slug,
            names: `${project.partner1_name} & ${project.partner2_name}`,
            from: project.status, to: newStatus, reason,
          });
        }
      }
    }
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message, results };
  }
}

export async function checkProjectStatus(projectId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: project } = await db({
    action: 'select', table: 'projects',
    filters: [{ op: 'eq', column: 'id', value: projectId }],
    options: { select: 'status, wedding_date, std_date, archive_date', single: true },
  });

  const stdDate = project?.std_date ? new Date(project.std_date) : null;
  const archiveDate = project?.archive_date ? new Date(project.archive_date) : null;
  let recommendedStatus = project?.status || 'std';
  let reason = 'Keine automatische Änderung';

  if (archiveDate && today >= archiveDate) {
    recommendedStatus = 'archive'; reason = `Archiv-Datum (${project.archive_date}) erreicht`;
  } else if (stdDate && today >= stdDate) {
    recommendedStatus = 'live'; reason = `STD-Ende (${project.std_date}) erreicht`;
  }

  return {
    currentStatus: project?.status, recommendedStatus,
    shouldUpdate: project?.status !== recommendedStatus, reason,
    dates: { stdDate: project?.std_date, archiveDate: project?.archive_date, weddingDate: project?.wedding_date },
  };
}

export default supabase;
