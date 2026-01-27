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
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 2rem;
`;

const Card = styled.div`
  background: #111;
  border: 1px solid #222;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.75rem;
    color: #666;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 1rem;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #555;
  }
  
  &::placeholder {
    color: #555;
  }
`;

const Button = styled.button`
  padding: 1rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #eee;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Error = styled.div`
  color: #ff4444;
  font-size: 0.85rem;
  text-align: center;
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
      toast.success('Willkommen! 👋');
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
          <h1>S&I Wedding</h1>
          <p>SuperAdmin</p>
        </Logo>
        
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Error>{error}</Error>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Wird geprüft...' : 'Anmelden'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}
