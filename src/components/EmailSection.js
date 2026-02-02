// src/components/EmailSection.js
// E-Mail Tab für ProjectDetailPage

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { getEmailLogs } from '../lib/supabase';
import { sendEmail, getEmailPreview, sendWelcomeEmails, sendGoLiveEmail } from '../lib/emailService';
import { adminResetPassword } from '../lib/passwordResetService';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', green: '#10B981', orange: '#F59E0B', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const Container = styled.div``;

const SectionTitle = styled.h3`
  font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.1em; color: ${colors.black};
  margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid ${colors.lightGray};
`;

const EmailLog = styled.div`
  background: ${colors.white}; border: 1px solid ${colors.lightGray}; margin-bottom: 0.75rem;
`;

const LogHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1rem; cursor: pointer;
  &:hover { background: ${colors.background}; }
`;

const LogInfo = styled.div`
  display: flex; align-items: center; gap: 1rem;
  .status { width: 8px; height: 8px; border-radius: 50%; }
  .status.sent { background: ${colors.green}; }
  .status.failed { background: ${colors.red}; }
  .status.pending { background: ${colors.orange}; }
  .date { font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${colors.gray}; min-width: 80px; }
  .subject { font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 500; }
  .type { font-family: 'Inter', sans-serif; font-size: 0.65rem; text-transform: uppercase;
    letter-spacing: 0.05em; padding: 0.2rem 0.5rem; background: ${colors.background}; color: ${colors.gray}; }
`;

const LogActions = styled.div`
  display: flex; gap: 0.5rem;
`;

const SmallButton = styled.button`
  font-family: 'Inter', sans-serif; font-size: 0.7rem; padding: 0.35rem 0.75rem;
  background: transparent; border: 1px solid ${colors.lightGray}; cursor: pointer;
  transition: all 0.2s ease;
  &:hover { background: ${colors.black}; color: ${colors.white}; border-color: ${colors.black}; }
`;

const LogPreview = styled.div`
  padding: 1rem; border-top: 1px solid ${colors.lightGray}; background: ${colors.background};
  max-height: 300px; overflow: auto;
  iframe { width: 100%; height: 250px; border: 1px solid ${colors.lightGray}; background: white; }
`;

const QuickActions = styled.div`
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const ActionCard = styled.button`
  display: flex; flex-direction: column; align-items: flex-start; padding: 1.25rem;
  background: ${colors.white}; border: 2px solid ${colors.lightGray};
  cursor: pointer; text-align: left; transition: all 0.2s ease;
  &:hover { border-color: ${colors.black}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  .icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .title { font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; }
  .desc { font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${colors.gray}; margin-top: 0.25rem; }
`;

const ManualEmail = styled.div`
  background: ${colors.white}; border: 2px solid ${colors.black}; padding: 1.5rem; margin-top: 2rem;
`;

const FormGroup = styled.div`margin-bottom: 1rem;`;
const Label = styled.label`display: block; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.5rem;`;
const Select = styled.select`width: 100%; padding: 0.75rem; border: 2px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif; font-size: 0.9rem; cursor: pointer;
  &:focus { outline: none; border-color: ${colors.black}; }`;
const TextArea = styled.textarea`width: 100%; padding: 0.75rem; border: 2px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif; font-size: 0.9rem; min-height: 100px; resize: vertical;
  &:focus { outline: none; border-color: ${colors.black}; }`;
const Input = styled.input`width: 100%; padding: 0.75rem; border: 2px solid ${colors.lightGray};
  font-family: 'Inter', sans-serif; font-size: 0.9rem;
  &:focus { outline: none; border-color: ${colors.black}; }`;

const ButtonRow = styled.div`display: flex; gap: 1rem; margin-top: 1rem;`;
const Button = styled.button`
  padding: 0.75rem 1.5rem; font-family: 'Oswald', sans-serif; font-size: 0.8rem;
  font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
  transition: all 0.2s ease;
  ${p => p.$primary ? `background: ${colors.red}; color: ${colors.white}; border: 2px solid ${colors.red};
    &:hover:not(:disabled) { background: ${colors.black}; border-color: ${colors.black}; }` :
    `background: transparent; color: ${colors.black}; border: 2px solid ${colors.black};
    &:hover { background: ${colors.black}; color: ${colors.white}; }`}
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  text-align: center; padding: 2rem; color: ${colors.gray};
  font-family: 'Inter', sans-serif; font-size: 0.9rem;
`;

const PreviewModal = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem;
`;

const PreviewContent = styled.div`
  background: white; width: 100%; max-width: 700px; max-height: 90vh; overflow: auto;
  .header { display: flex; justify-content: space-between; align-items: center; padding: 1rem;
    background: ${colors.black}; color: white; }
  .title { font-family: 'Oswald', sans-serif; font-size: 1rem; text-transform: uppercase; }
  .close { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
  iframe { width: 100%; height: 500px; border: none; }
`;

const TEMPLATE_OPTIONS = [
  { value: 'welcome', label: 'Willkommen + Vertrag' },
  { value: 'credentials', label: 'Zugangsdaten' },
  { value: 'golive', label: 'Website ist live' },
  { value: 'reminder', label: 'Erinnerung Inhalte' },
  { value: 'custom', label: 'Eigene Nachricht' },
];

export default function EmailSection({ project }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [sending, setSending] = useState(false);
  
  // Manual Email State
  const [manualTemplate, setManualTemplate] = useState('reminder');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    loadLogs();
  }, [project.id]);

  const loadLogs = async () => {
    const { data } = await getEmailLogs(project.id);
    setLogs(data || []);
    setIsLoading(false);
  };

  const handleSendWelcome = async () => {
    if (!project.client_email) {
      toast.error('Keine Kunden-E-Mail hinterlegt!');
      return;
    }
    setSending(true);
    const result = await sendWelcomeEmails(project);
    if (result.welcome.success && result.credentials.success) {
      toast.success('Willkommens-E-Mails gesendet!');
      loadLogs();
    } else {
      toast.error('Fehler beim Senden');
    }
    setSending(false);
  };

  const handleSendGoLive = async () => {
    if (!project.client_email) {
      toast.error('Keine Kunden-E-Mail hinterlegt!');
      return;
    }
    setSending(true);
    const result = await sendGoLiveEmail(project);
    if (result.success) {
      toast.success('Go-Live E-Mail gesendet!');
      loadLogs();
    } else {
      toast.error('Fehler beim Senden');
    }
    setSending(false);
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Neues Passwort generieren und an Kunden senden?')) return;
    setSending(true);
    const result = await adminResetPassword(project.id, true);
    if (result.success) {
      toast.success(`Neues Passwort: ${result.newPassword}`);
      loadLogs();
    } else {
      toast.error(result.error);
    }
    setSending(false);
  };

  const handleSendManual = async () => {
    if (!project.client_email) {
      toast.error('Keine Kunden-E-Mail hinterlegt!');
      return;
    }
    setSending(true);
    
    const variables = {
      couple_names: project.couple_names,
      wedding_date: project.wedding_date,
      package_name: project.package,
      admin_url: `https://siwedding.de/${project.slug}/admin`,
      admin_password: project.admin_password,
      website_url: project.custom_domain || `siwedding.de/${project.slug}`,
      custom_subject: customSubject,
      custom_title: customSubject,
      custom_message: customMessage,
    };

    const result = await sendEmail({
      to: project.client_email,
      toName: project.client_name,
      templateType: manualTemplate,
      variables,
      theme: project.theme,
      projectId: project.id,
    });

    if (result.success) {
      toast.success('E-Mail gesendet!');
      setCustomSubject('');
      setCustomMessage('');
      loadLogs();
    } else {
      toast.error('Fehler: ' + result.error);
    }
    setSending(false);
  };

  const handlePreview = (templateType) => {
    const variables = {
      couple_names: project.couple_names,
      wedding_date: project.wedding_date,
      package_name: project.package,
      admin_url: `https://siwedding.de/${project.slug}/admin`,
      admin_password: '********',
      website_url: project.custom_domain || `siwedding.de/${project.slug}`,
      custom_subject: customSubject || 'Vorschau',
      custom_title: customSubject || 'Vorschau',
      custom_message: customMessage || '<p>Ihre Nachricht hier...</p>',
    };
    const preview = getEmailPreview(templateType, variables, project.theme);
    setPreviewModal({ subject: preview.subject, html: preview.html });
  };

  const handleResend = async (log) => {
    if (!window.confirm('E-Mail erneut senden?')) return;
    setSending(true);
    const result = await sendEmail({
      to: log.recipient_email,
      toName: log.recipient_name,
      templateType: log.template_type,
      variables: log.variables,
      theme: log.theme,
      projectId: project.id,
    });
    if (result.success) {
      toast.success('E-Mail erneut gesendet!');
      loadLogs();
    } else {
      toast.error('Fehler beim Senden');
    }
    setSending(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const getTemplateLabel = (type) => {
    const option = TEMPLATE_OPTIONS.find(o => o.value === type);
    return option?.label || type;
  };

  return (
    <Container>
      {/* Quick Actions */}
      <SectionTitle>Schnellaktionen</SectionTitle>
      <QuickActions>
        <ActionCard onClick={handleSendWelcome} disabled={sending || !project.client_email}>
          <span className="icon">📧</span>
          <span className="title">Willkommen senden</span>
          <span className="desc">Vertrag + Zugangsdaten an Kunden</span>
        </ActionCard>
        <ActionCard onClick={handleSendGoLive} disabled={sending || !project.client_email}>
          <span className="icon">🚀</span>
          <span className="title">Go-Live senden</span>
          <span className="desc">Website ist online Benachrichtigung</span>
        </ActionCard>
        <ActionCard onClick={handleResetPassword} disabled={sending}>
          <span className="icon">🔐</span>
          <span className="title">Passwort zurücksetzen</span>
          <span className="desc">Neues Passwort generieren & senden</span>
        </ActionCard>
        <ActionCard onClick={() => handlePreview(manualTemplate)} disabled={sending}>
          <span className="icon">👁️</span>
          <span className="title">Vorschau</span>
          <span className="desc">Template im Theme ansehen</span>
        </ActionCard>
      </QuickActions>

      {/* Email Log */}
      <SectionTitle>Gesendete E-Mails ({logs.length})</SectionTitle>
      {isLoading ? (
        <EmptyState>Laden...</EmptyState>
      ) : logs.length === 0 ? (
        <EmptyState>Noch keine E-Mails gesendet</EmptyState>
      ) : (
        logs.map(log => (
          <EmailLog key={log.id}>
            <LogHeader onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
              <LogInfo>
                <span className={`status ${log.status}`}></span>
                <span className="date">{formatDate(log.sent_at || log.created_at)}</span>
                <span className="subject">{log.subject}</span>
                <span className="type">{getTemplateLabel(log.template_type)}</span>
              </LogInfo>
              <LogActions>
                <SmallButton onClick={(e) => { e.stopPropagation(); setPreviewModal({ subject: log.subject, html: log.html_content }); }}>
                  Ansehen
                </SmallButton>
                <SmallButton onClick={(e) => { e.stopPropagation(); handleResend(log); }}>
                  ↻
                </SmallButton>
              </LogActions>
            </LogHeader>
            {expandedLog === log.id && (
              <LogPreview>
                <p><strong>An:</strong> {log.recipient_email}</p>
                <p><strong>Status:</strong> {log.status}</p>
                {log.attachments?.length > 0 && <p><strong>Anhänge:</strong> {log.attachments.join(', ')}</p>}
              </LogPreview>
            )}
          </EmailLog>
        ))
      )}

      {/* Manual Email */}
      <ManualEmail>
        <SectionTitle>E-Mail manuell senden</SectionTitle>
        <FormGroup>
          <Label>Template</Label>
          <Select value={manualTemplate} onChange={e => setManualTemplate(e.target.value)}>
            {TEMPLATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormGroup>
        
        {manualTemplate === 'custom' && (
          <>
            <FormGroup>
              <Label>Betreff</Label>
              <Input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Betreff eingeben..." />
            </FormGroup>
            <FormGroup>
              <Label>Nachricht (HTML erlaubt)</Label>
              <TextArea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="<p>Ihre Nachricht...</p>" />
            </FormGroup>
          </>
        )}

        <ButtonRow>
          <Button onClick={() => handlePreview(manualTemplate)}>Vorschau</Button>
          <Button $primary onClick={handleSendManual} disabled={sending || !project.client_email}>
            {sending ? 'Senden...' : 'Senden'}
          </Button>
        </ButtonRow>
        
        {!project.client_email && (
          <p style={{ color: colors.red, fontSize: '0.8rem', marginTop: '0.5rem' }}>
            ⚠️ Keine Kunden-E-Mail hinterlegt
          </p>
        )}
      </ManualEmail>

      {/* Preview Modal */}
      {previewModal && (
        <PreviewModal onClick={() => setPreviewModal(null)}>
          <PreviewContent onClick={e => e.stopPropagation()}>
            <div className="header">
              <span className="title">{previewModal.subject}</span>
              <button className="close" onClick={() => setPreviewModal(null)}>×</button>
            </div>
            <iframe srcDoc={previewModal.html} title="Email Preview" />
          </PreviewContent>
        </PreviewModal>
      )}
    </Container>
  );
}
