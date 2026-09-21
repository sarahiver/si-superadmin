// core/editors/RSVPEditor.js - Schema-konform
import React from 'react';
import { useAdmin } from '../AdminContext';
import { useHiddenFields } from './themeFieldConfig';
import ImageUploader from './ImageUploader';
import MediaUploader from './MediaUploader';

function RSVPEditor({ components: C }) {
  const { contentStates, updateContentField, saveContent, isSaving, baseFolder , project} = useAdmin();
  const { hidden } = useHiddenFields('rsvp', project);
  const content = contentStates.rsvp || {};
  const theme = project?.theme;
  const isClassic = theme === 'classic';
  const isEditorial = theme === 'editorial';
  const showDeadline = true;
  const showCustomQuestion = true;
  const update = (field, value) => updateContentField('rsvp', field, value);

  return (
    <C.Panel>
      <C.PanelHeader>
        <C.PanelTitle>RSVP bearbeiten</C.PanelTitle>
      </C.PanelHeader>
      <C.PanelContent>
        <C.FormGroup>
          <C.Label>Titel</C.Label>
          <C.Input 
            value={content.title || ''} 
            onChange={(e) => update('title', e.target.value)}
            placeholder="Zusage"
          />
        </C.FormGroup>
        
        <C.FormGroup>
          <C.Label>Beschreibung</C.Label>
          <C.TextArea 
            value={content.description || ''} 
            onChange={(e) => update('description', e.target.value)}
            placeholder="Bitte gebt uns bis zum ... Bescheid..."
          />
        </C.FormGroup>
        
        {showDeadline && (
          <C.FormGroup>
            <C.Label>Anmeldefrist</C.Label>
            <C.Input
              type="date"
              value={content.deadline || ''}
              onChange={(e) => update('deadline', e.target.value)}
            />
          </C.FormGroup>
        )}
        
        {isClassic && (
          <C.SectionLabel>Hintergrundbild</C.SectionLabel>
        )}
        {isClassic && !hidden('background_image') && (
          <ImageUploader components={C} image={content.background_image} onUpload={(url) => update('background_image', url)} folder={`${baseFolder}/rsvp`} label="Hintergrund" helpText="Video oder Bild hinter dem RSVP-Formular" />
        )}

        {isEditorial && !hidden('background_media') && (
          <>
            <C.SectionLabel>Hintergrund</C.SectionLabel>
            <MediaUploader
              components={C}
              media={content.background_media}
              onUpload={(media) => update('background_media', media)}
              folder={`${baseFolder}/rsvp`}
              label="Hintergrund (Video oder Bild)"
              ratio="16/9"
              maxHeight="150px"
              allowVideo={true}
            />
            <C.HelpText>Leer lassen für das Standard-Video. Wird schwarz-weiß dargestellt.</C.HelpText>
          </>
        )}

        <C.SectionLabel>Formular-Optionen</C.SectionLabel>
        
        <C.FormGroup>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={content.ask_dietary || false}
              onChange={(e) => update('ask_dietary', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#C41E3A' }}
            />
            <span style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.7))' }}>Ernährungswünsche abfragen (vegetarisch, vegan, etc.)</span>
          </label>
        </C.FormGroup>
        
        {!hidden('ask_allergies') && (
        <C.FormGroup>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={content.ask_allergies || false}
              onChange={(e) => update('ask_allergies', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#C41E3A' }}
            />
            <span style={{ color: 'var(--admin-text-secondary, rgba(255,255,255,0.7))' }}>Allergien/Unverträglichkeiten abfragen</span>
          </label>
        </C.FormGroup>
        )}

        {showCustomQuestion && (
          <>
            <C.Divider />

            <C.SectionLabel>Eigene Frage</C.SectionLabel>

            <C.FormGroup>
              <C.Label>Eigene Frage (optional)</C.Label>
              <C.Input
                value={content.custom_question || ''}
                onChange={(e) => update('custom_question', e.target.value)}
                placeholder="z.B. Brauchst du eine Übernachtung?"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted, rgba(255,255,255,0.5))', marginTop: '0.5rem' }}>
                Diese Frage erscheint als Freitextfeld im RSVP-Formular
              </p>
            </C.FormGroup>
          </>
        )}

        <C.Divider />
        <C.Button onClick={() => saveContent('rsvp')} disabled={isSaving}>
          {isSaving ? 'Speichern...' : '💾 Speichern'}
        </C.Button>
      </C.PanelContent>
    </C.Panel>
  );
}

export default RSVPEditor;
