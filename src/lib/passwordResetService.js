// src/lib/passwordResetService.js
// Passwort Reset Flow für Kunden-Dashboards

import { supabase } from './supabase';
import { sendEmail } from './emailService';

// Generiere kryptografisch sicheres Passwort
function generatePassword(length = 12) {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(x => chars[x % chars.length]).join('');
}

// Generiere Reset Token
function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================
// PASSWORT RESET ANFORDERN (Vom Kunden)
// ============================================
export async function requestPasswordReset(email, slug) {
  try {
    // Projekt finden
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Projekt nicht gefunden' };
    }

    // Prüfen ob E-Mail zum Projekt gehört
    if (project.client_email !== email && project.admin_email !== email) {
      // Aus Sicherheitsgründen keine spezifische Fehlermeldung
      return { success: true, message: 'Falls die E-Mail korrekt ist, erhalten Sie eine Nachricht.' };
    }

    // Neues Passwort generieren
    const newPassword = generatePassword(10);

    // Passwort in DB aktualisieren
    const { error: updateError } = await supabase
      .from('projects')
      .update({ admin_password: newPassword })
      .eq('id', project.id);

    if (updateError) {
      return { success: false, error: 'Fehler beim Aktualisieren' };
    }

    // Reset-E-Mail senden
    const emailResult = await sendEmail({
      to: email,
      toName: project.client_name,
      templateType: 'password_reset',
      variables: {
        couple_names: project.couple_names,
        new_password: newPassword,
        admin_url: `https://siwedding.de/${project.slug}/admin`,
      },
      theme: project.theme,
      projectId: project.id,
    });

    return { 
      success: emailResult.success, 
      message: 'Falls die E-Mail korrekt ist, erhalten Sie eine Nachricht mit dem neuen Passwort.' 
    };

  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten' };
  }
}

// ============================================
// PASSWORT MANUELL ZURÜCKSETZEN (Vom SuperAdmin)
// ============================================
export async function adminResetPassword(projectId, sendEmailNotification = true) {
  try {
    // Projekt laden
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Projekt nicht gefunden' };
    }

    // Neues Passwort generieren
    const newPassword = generatePassword(10);

    // Passwort aktualisieren
    const { error: updateError } = await supabase
      .from('projects')
      .update({ admin_password: newPassword })
      .eq('id', projectId);

    if (updateError) {
      return { success: false, error: 'Fehler beim Aktualisieren' };
    }

    // Optional: E-Mail senden
    if (sendEmailNotification && project.client_email) {
      await sendEmail({
        to: project.client_email,
        toName: project.client_name,
        templateType: 'password_reset',
        variables: {
          couple_names: project.couple_names,
          new_password: newPassword,
          admin_url: `https://siwedding.de/${project.slug}/admin`,
        },
        theme: project.theme,
        projectId: project.id,
      });
    }

    return { 
      success: true, 
      newPassword,
      message: sendEmailNotification ? 'Passwort zurückgesetzt und E-Mail gesendet' : 'Passwort zurückgesetzt'
    };

  } catch (error) {
    console.error('Admin password reset error:', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten' };
  }
}

export default { requestPasswordReset, adminResetPassword };
