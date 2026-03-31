// In-house Lawyer Dashboard
import { LawyerDashboardFull } from './phases/LawyerDashboardFull';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { useNavigate } from 'react-router-dom';

export function LawyerDashboard() {
  const { currentUser, logout } = usePersonaAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/');
    return null;
  }

  // Use the full Phase 6 dashboard
  return <LawyerDashboardFull />;
}
