// src/pages/LoginPage.js
// Mit SHA-256 Hash für sicheres Passwort
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuth } from '../App';

const colors = { black: '#0A0A0A', white: '#FAFAFA', red: '#C41E3A', gray: '#666666', lightGray: '#E5E5E5', background: '#F5F5F5' };

const Container = styled.div`min-height: 100vh; display: flex; align-items: center; justify-content: center; background: ${colors.black}; padding: 2rem;`;
const Card = styled.div`background: ${colors.white}; width: 100%; max-width: 420px; border: 3px solid ${colors.black};`;
const Header = styled.div`background: ${colors.black}; padding: 2rem; text-align: center;`;
const Logo = styled.h1`font-family: 'Oswald', sans-serif; font-size: 2rem; font-weight: 700; color: ${colors.white}; letter-spacing: 0.05em; span { color: ${colors.red}; font-style: italic; }`;
const Subtitle = styled.p`font-family: 'Inter', sans-serif; font-size: 0.75rem; color: ${colors.gray}; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 0.5rem;`;
const Body = styled.div`padding: 2rem;`;
const Form = styled.form`display: flex; flex-direction: column; gap: 1.5rem;`;
const FormGroup = styled.div``;
const Label = styled.label`display: block; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: ${colors.black}; margin-bottom: 0.5rem;`;
const Input = styled.input`width: 100%; padding: 1rem; background: ${colors.background}; border: 2px solid ${colors.lightGray}; font-family: 'Inter', sans-serif; font-size: 1rem; color: ${colors.black}; transition: all 0.2s ease; &:focus { outline: none; border-color: ${colors.black}; background: ${colors.white}; }`;
const Button = styled.button`width: 100%; padding: 1rem; font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; background: ${colors.red}; color: ${colors.white}; border: 2px solid ${colors.red}; cursor: pointer; transition: all 0.2s ease; &:hover:not(:disabled) { background: ${colors.black}; border-color: ${colors.black}; } &:disabled { opacity: 0.5; cursor: not-allowed; }`;
const ErrorBox = styled.div`font-family: 'Inter', sans-serif; font-size: 0.85rem; color: ${colors.red}; background: ${colors.red}15; padding: 0.75rem 1rem; border: 1px solid ${colors.red};`;

// SHA-256 Hash Funktion
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Passwort hashen vor dem Senden
      const passwordHash = await hashPassword(password);

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        setError(data.error || 'Ungültige Anmeldedaten');
        setIsLoading(false);
        return;
      }

      // Token speichern + einloggen
      localStorage.setItem('si_admin_token', data.token);
      login(data.user);
      toast.success('Eingeloggt!');
      navigate('/');
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <Container>
      <Card>
        <Header>
          <Logo>S<span>&</span>I. wedding</Logo>
          <Subtitle>Super Admin</Subtitle>
        </Header>
        <Body>
          <Form onSubmit={handleSubmit}>
            {error && <ErrorBox>{error}</ErrorBox>}
            <FormGroup>
              <Label>E-Mail</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@siwedding.de" required autoFocus />
            </FormGroup>
            <FormGroup>
              <Label>Passwort</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </FormGroup>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Anmelden...' : 'Anmelden'}</Button>
          </Form>
        </Body>
      </Card>
    </Container>
  );
}
