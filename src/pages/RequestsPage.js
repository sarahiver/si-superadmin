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
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 2rem;
    font-weight: 400;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  background: #fff;
  border: 1px solid #E5E5E5;
  padding: 0.25rem;
  width: fit-content;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${p => p.$active ? '#1A1A1A' : 'transparent'};
  color: ${p => p.$active ? '#fff' : '#666'};
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s;
  
  &:hover {
    background: ${p => p.$active ? '#1A1A1A' : '#F5F5F5'};
  }
`;

const Table = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 100px 100px 100px;
  gap: 1rem;
  padding: 0.875rem 1.5rem;
  background: #FAFAFA;
  border-bottom: 1px solid #E5E5E5;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 100px 100px 100px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #F5F5F5;
  align-items: center;
  
  &:last-child { border-bottom: none; }
  &:hover { background: #FAFAFA; }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr auto;
  }
`;

const Name = styled.div`
  font-weight: 500;
  color: #1A1A1A;
`;

const Email = styled.div`
  color: #666;
  font-size: 0.85rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const DateCell = styled.div`
  font-size: 0.8rem;
  color: #666;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.6rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: ${p => {
    switch(p.$status) {
      case 'new': return '#FEE2E2';
      case 'contacted': return '#FEF3C7';
      case 'converted': return '#D1FAE5';
      case 'deleted': return '#F5F5F5';
      case 'archived': return '#F5F5F5';
      default: return '#FEE2E2';
    }
  }};
  color: ${p => {
    switch(p.$status) {
      case 'new': return '#DC2626';
      case 'contacted': return '#D97706';
      case 'converted': return '#059669';
      case 'deleted': return '#999';
      case 'archived': return '#666';
      default: return '#DC2626';
    }
  }};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.35rem 0.65rem;
  background: #fff;
  color: ${p => p.$danger ? '#DC2626' : '#666'};
  border: 1px solid ${p => p.$danger ? '#FCA5A5' : '#E5E5E5'};
  font-size: 0.7rem;
  transition: all 0.15s;
  
  &:hover {
    background: ${p => p.$danger ? '#FEE2E2' : '#F5F5F5'};
    border-color: ${p => p.$danger ? '#DC2626' : '#ccc'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  
  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.25rem;
    font-weight: 400;
    color: #1A1A1A;
    margin-bottom: 0.5rem;
  }
`;

// Modal
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled.div`
  background: #fff;
  border: 1px solid #E5E5E5;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E5E5E5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 1.25rem;
    font-weight: 400;
  }
  
  button {
    background: none;
    border: none;
    color: #666;
    font-size: 1.25rem;
    cursor: pointer;
    
    &:hover { color: #1A1A1A; }
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const DetailRow = styled.div`
  margin-bottom: 1.25rem;
  
  .label {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #666;
    margin-bottom: 0.35rem;
  }
  
  .value {
    color: #1A1A1A;
    font-size: 0.9rem;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
  
  &:focus {
    outline: none;
    border-color: #1A1A1A;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E5E5E5;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: ${p => p.$primary ? '#1A1A1A' : '#fff'};
  color: ${p => p.$primary ? '#fff' : '#666'};
  border: 1px solid ${p => p.$primary ? '#1A1A1A' : '#E5E5E5'};
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.15s;
  
  &:hover {
    background: ${p => p.$primary ? '#333' : '#F5F5F5'};
  }
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
    navigate('/projects/new', { state: { fromRequest: request } });
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return (r.status || 'new') !== 'deleted';
    if (filter === 'deleted') return r.status === 'deleted';
    return (r.status || 'new') === filter;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('de-DE');
  };

  if (isLoading) {
    return <Layout stats={stats}><div style={{ color: '#666', padding: '2rem' }}>Laden...</div></Layout>;
  }

  const newCount = requests.filter(r => !r.status || r.status === 'new').length;
  const contactedCount = requests.filter(r => r.status === 'contacted').length;
  const convertedCount = requests.filter(r => r.status === 'converted').length;
  const deletedCount = requests.filter(r => r.status === 'deleted').length;

  return (
    <Layout stats={stats}>
      <Header>
        <h1>Kontaktanfragen</h1>
      </Header>
      
      <Filters>
        <FilterButton $active={filter === 'all'} onClick={() => setFilter('all')}>
          Alle ({requests.length - deletedCount})
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
        {deletedCount > 0 && (
          <FilterButton $active={filter === 'deleted'} onClick={() => setFilter('deleted')} style={{ opacity: 0.5 }}>
            Gelöscht ({deletedCount})
          </FilterButton>
        )}
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
              <n>{request.name}</n>
              <Email>{request.email}</Email>
              <DateCell>{formatDate(request.created_at)}</DateCell>
              <div>
                <StatusBadge $status={request.status || 'new'}>
                  {request.status || 'neu'}
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
        <Table>
          <EmptyState>
            <h2>Keine Anfragen</h2>
            <p>Aktuell liegen keine Kontaktanfragen vor.</p>
          </EmptyState>
        </Table>
      )}
      
      {/* Detail Modal */}
      {selectedRequest && (
        <ModalOverlay onClick={() => setSelectedRequest(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
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
                <option value="deleted">Gelöscht</option>
              </Select>
              
              <ModalActions>
                <Button onClick={() => setSelectedRequest(null)}>Schließen</Button>
                <Button $primary onClick={() => handleCreateProject(selectedRequest)}>
                  Projekt erstellen →
                </Button>
              </ModalActions>
            </ModalBody>
          </Modal>
        </ModalOverlay>
      )}
    </Layout>
  );
}
