// src/pages/LoginPage.js
import React, { useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { verifyAdminLogin } from '../lib/supabase';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FAFAFA;
  padding: 2rem;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
  padding: 3rem;
  width: 100%;
  max-width: 380px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
  
  h1 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.75rem;
    font-weight: 400;
    color: #1A1A1A;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.65rem;
    font-weight: 500;
    color: #999;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  color: #1A1A1A;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #1A1A1A;
    background: #fff;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: #1A1A1A;
  color: #fff;
  border: none;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #333;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Error = styled.div`
  color: #DC2626;
  font-size: 0.8rem;
  text-align: center;
  padding: 0.75rem;
  background: #FEE2E2;
  border: 1px solid #FECACA;
`;

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await verifyAdminLogin(username, password);

    if (result.success) {
      login();
      toast.success('Willkommen!');
      navigate('/');
    } else {
      setError(result.error || 'Login fehlgeschlagen');
    }

    setIsLoading(false);
  };

  return (
    <Container>
      <Card>
        <Logo>
          <h1>S & I Wedding</h1>
          <p>SuperAdmin</p>
        </Logo>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Benutzername</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </FormGroup>
          <FormGroup>
            <Label>Passwort</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>
          {error && <Error>{error}</Error>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Wird geprüft...' : 'Anmelden'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}
