import { Navigate } from 'react-router-dom';

/**
 * Dashboard page — for now redirects to Environments.
 * In future phases this will be a portal-level dashboard
 * showing cross-module status (EOD, monitoring, jobs).
 */
export default function DashboardPage() {
  return <Navigate to="/environments" replace />;
}
