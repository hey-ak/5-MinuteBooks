import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from '@getmocha/users-service/react';
import { AuthProvider as SimpleAuthProvider } from '@/react-app/hooks/useSimpleAuth';
import { NotificationProvider } from '@/react-app/hooks/useNotifications';
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
import SignIn from "@/react-app/pages/SignIn";
import SignUp from "@/react-app/pages/SignUp";
import HomePage from "@/react-app/pages/Home";
import BookPage from "@/react-app/pages/Book";
import FavoritesPage from "@/react-app/pages/Favorites";
import AuthCallback from "@/react-app/pages/AuthCallback";
import AdminLogin from "@/react-app/pages/AdminLogin";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import AdminBookForm from "@/react-app/pages/AdminBookForm";
import AdminCategoryForm from "@/react-app/pages/AdminCategoryForm";

export default function App() {
  return (
    <SimpleAuthProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/book/:id" element={
                <ProtectedRoute>
                  <BookPage />
                </ProtectedRoute>
              } />
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              } />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/books/:id" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminBookForm />
                </ProtectedRoute>
              } />
              <Route path="/admin/categories/:id" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminCategoryForm />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </SimpleAuthProvider>
  );
}
