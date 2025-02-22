import { Navigate, useLocation } from 'react-router-dom';

interface AuthMiddlewareProps {
  children: React.ReactNode;
}

export const AuthMiddleware = ({ children }: AuthMiddlewareProps) => {
  const location = useLocation();
  
  // Check if we're already on the login page to prevent redirect loops
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  // Check for tokens in cookies
  const hasToken = document.cookie.includes('app-token=');
  const hasRefreshToken = document.cookie.includes('app-token-refresh=');

  if (!hasToken && !hasRefreshToken) {
    // Redirect to login if no tokens found, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}; 