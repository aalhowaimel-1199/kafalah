import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/admin/Login";
import { Dashboard } from "./pages/admin/Dashboard";
import { Invitations } from "./pages/admin/Invitations";
import { Monitoring } from "./pages/admin/Monitoring";
import { Blacklist } from "./pages/admin/Blacklist";
import { Notes } from "./pages/admin/Notes";
import { Reasons } from "./pages/admin/Reasons";
import { Users } from "./pages/admin/Users";
import { EmailSettings } from "./pages/admin/EmailSettings";
import { BiotimeSettings } from "./pages/admin/BiotimeSettings";
import { Pages } from "./pages/admin/Pages";
import { Register } from "./pages/admin/Register";
import { Departments } from "./pages/admin/Departments";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="register" element={<Register />} />
        <Route path="departments" element={<Departments />} />
        <Route path="invitations" element={<Invitations />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="blacklist" element={<Blacklist />} />
        <Route path="notes" element={<Notes />} />
        <Route path="reasons" element={<Reasons />} />
        <Route path="users" element={<Users />} />
        <Route path="email" element={<EmailSettings />} />
        <Route path="biotime" element={<BiotimeSettings />} />
        <Route path="pages" element={<Pages />} />
      </Route>
    </Routes>
  );
}
