// src/pages/RequestsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { getContactRequests, updateContactRequest, deleteContactRequest, getDashboardStats } from '../lib/supabase';

const Header = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 600;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${p => p.$active ? '#fff' : '#111'};
  color: ${p => p.$active ? '#000' : '#888'};
  border: 1px solid ${p => p.$active ? '#fff' : '#333'};
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #fff;
    color: ${p => p.$active ? '#000' : '#fff'};
  }
`;

const Table = styled.div`
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  overflow: hidden;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 120px 100px 140px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #222;
  align-items: center;
  
  &:last-child { border-bottom: none; }
  
  &:hover { background: #1a1a1a; }
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const TableHeader = styled(TableRow)`
  background: #0a0a0a;
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover { background: #0a0a0a; }
`;

const Name = styled.div`
  font-weight: 500;
`;

const Email = styled.div`
  color: #888;
  font-size: 0.85rem;
`;

const Date = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${p => {
    switch(p.$status) {
      case 'new': return '#ff444422';
      case 'contacted': return '#eab30822';
      case 'converted': return '#22c55e22';
      case 'archived': return '#66666622';
      default: return '#ff444422';
    }
  }};
  color: ${p => {
    switch(p.$status) {
      case 'new': return '#ff4444';
      case 'contacted': return '#eab308';
      case 'converted': return '#22c55e';
      case 'archived': return '#666';
      default: return '#ff4444';
    }
  }};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.4rem 0.75rem;
  background: ${p => p.$danger ? 'transparent' : '#222'};
  color: ${p => p.$danger ? '#ff4444' : '#888'};
  border: 1px solid ${p => p.$danger ? '#ff444444' : '#333'};
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${p => p.$danger ? '#ff444422' : '#333'};
    color: ${p => p.$danger ? '#ff4444' : '#fff'};
  }
`;

const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #111;
  border: 1px solid #333;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  button {
    background: none;
    border: none;
    color: #666;
    font-size: 1.5rem;
    cursor: pointer;
    
    &:hover { color: #fff; }
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const DetailRow = styled.div`
  margin-bottom: 1.25rem;
  
  .label {
    font-size: 0.7rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }
  
  .value {
    color: #fff;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: #0a0a0a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #222;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: ${p => p.$primary ? '#fff' : 'transparent'};
  color: ${p => p.$primary ? '#000' : '#888'};
  border: 1px solid ${p => p.$primary ? '#fff' : '#333'};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${p => p.$primary ? '#eee' : '#222'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
`;

export default function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [requestsRes, statsRes] = await Promise.all([
      getContactRequests(),
      getDashboardStats(),
    ]);
    setRequests(requestsRes.data || []);
    setStats(statsRes);
    setIsLoading(false);
  };

  const handleStatusChange = async (id, status) => {
    const { error } = await updateContactRequest(id, { status });
    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      toast.success('Status aktualisiert');
      loadData();
      setSelectedRequest(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Anfrage wirklich löschen?')) return;
    
    const { error } = await deleteContactRequest(id);
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Gelöscht');
      loadData();
      setSelectedRequest(null);
    }
  };

  const handleCreateProject = (request) => {
    // Navigate to new project page with pre-filled data
    navigate('/projects/new', { state: { fromRequest: request } });
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return (r.status || 'new') === filter;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  if (isLoading) {
    return <Layout stats={stats}><div style={{ color: '#666' }}>Laden...</div></Layout>;
  }

  const newCount = requests.filter(r => !r.status || r.status === 'new').length;
  const contactedCount = requests.filter(r => r.status === 'contacted').length;
  const convertedCount = requests.filter(r => r.status === 'converted').length;

  return (
    <Layout stats={stats}>
      <Header>
        <h1>Kontaktanfragen ({requests.length})</h1>
      </Header>
      
      <Filters>
        <FilterButton $active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle ({requests.length})
        </FilterButton>
        <FilterButton $active={filter === 'new'} onClick={() => setFilter('new')}>
          Neu ({newCount})
        </FilterButton>
        <FilterButton $active={filter === 'contacted'} onClick={() => setFilter('contacted')}>
          Kontaktiert ({contactedCount})
        </FilterButton>
        <FilterButton $active={filter === 'converted'} onClick={() => setFilter('converted')}>
          Konvertiert ({convertedCount})
        </FilterButton>
      </Filters>
      
      {filteredRequests.length > 0 ? (
        <Table>
          <TableHeader>
            <div>Name</div>
            <div>E-Mail</div>
            <div>Datum</div>
            <div>Status</div>
            <div>Aktionen</div>
          </TableHeader>
          
          {filteredRequests.map(request => (
            <TableRow key={request.id}>
              <Name>{request.name}</Name>
              <Email>{request.email}</Email>
              <Date>{formatDate(request.created_at)}</Date>
              <div>
                <StatusBadge $status={request.status || 'new'}>
                  {request.status || 'new'}
                </StatusBadge>
              </div>
              <Actions>
                <ActionButton onClick={() => setSelectedRequest(request)}>
                  Details
                </ActionButton>
                <ActionButton $danger onClick={() => handleDelete(request.id)}>
                  ×
                </ActionButton>
              </Actions>
            </TableRow>
          ))}
        </Table>
      ) : (
        <EmptyState>
          <p>Keine Anfragen gefunden</p>
        </EmptyState>
      )}
      
      {selectedRequest && (
        <Modal onClick={() => setSelectedRequest(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Anfrage Details</h2>
              <button onClick={() => setSelectedRequest(null)}>×</button>
            </ModalHeader>
            <ModalBody>
              <DetailRow>
                <div className="label">Name</div>
                <div className="value">{selectedRequest.name}</div>
              </DetailRow>
              <DetailRow>
                <div className="label">E-Mail</div>
                <div className="value">{selectedRequest.email}</div>
              </DetailRow>
              {selectedRequest.phone && (
                <DetailRow>
                  <div className="label">Telefon</div>
                  <div className="value">{selectedRequest.phone}</div>
                </DetailRow>
              )}
              {selectedRequest.wedding_date && (
                <DetailRow>
                  <div className="label">Hochzeitsdatum</div>
                  <div className="value">{formatDate(selectedRequest.wedding_date)}</div>
                </DetailRow>
              )}
              {selectedRequest.message && (
                <DetailRow>
                  <div className="label">Nachricht</div>
                  <div className="value">{selectedRequest.message}</div>
                </DetailRow>
              )}
              <DetailRow>
                <div className="label">Eingegangen am</div>
                <div className="value">{formatDate(selectedRequest.created_at)}</div>
              </DetailRow>
              
              <Select
                value={selectedRequest.status || 'new'}
                onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
              >
                <option value="new">Neu</option>
                <option value="contacted">Kontaktiert</option>
                <option value="converted">Konvertiert</option>
                <option value="archived">Archiviert</option>
              </Select>
              
              <ModalActions>
                <Button onClick={() => setSelectedRequest(null)}>Schließen</Button>
                <Button $primary onClick={() => handleCreateProject(selectedRequest)}>
                  → Projekt erstellen
                </Button>
              </ModalActions>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Layout>
  );
}
