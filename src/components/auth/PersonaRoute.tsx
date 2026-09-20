import { Navigate } from 'react-router-dom';
import { usePersonaAuth } from '@/lib/persona-auth-context';
import { PersonaType } from '@/types/personas';

interface PersonaRouteProps {
  children: React.ReactNode;
  allowedPersonas: PersonaType[];
}

export function PersonaRoute({ children, allowedPersonas }: PersonaRouteProps) {
  const { currentUser } = usePersonaAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!allowedPersonas.includes(currentUser.persona)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
