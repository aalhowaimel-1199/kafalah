import { Navigate } from "react-router-dom";
import { useSession } from "../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  if (isPending) return <div className="p-16 text-center text-slate">…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
