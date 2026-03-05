import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

import Layout from "@/components/Layout";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import RawMaterials from "@/pages/RawMaterials";
import Products from "@/pages/Products";
import BOM from "@/pages/BOM";
import Purchase from "@/pages/Purchase";
import Production from "@/pages/Production";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";

import "./index.css";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-slate-50"> <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div> </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton duration={4000} />

      <BrowserRouter>
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/master/raw-materials" element={
            <ProtectedRoute>
              <Layout>
                <RawMaterials />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/master/products" element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/bom" element={
            <ProtectedRoute>
              <Layout>
                <BOM />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/inventory/purchases" element={
            <ProtectedRoute>
              <Layout>
                <Purchase />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/production" element={
            <ProtectedRoute>
              <Layout>
                <Production />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;
