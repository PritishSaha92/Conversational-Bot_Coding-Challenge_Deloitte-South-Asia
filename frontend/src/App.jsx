import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import Chatbot from './pages/Chatbot';
import Interaction from "./pages/Interaction.jsx";
import Layout from './components/Layout';
import Profile from './pages/Profile';
import Employee from './pages/EmployeeList.jsx'
import HrDashChart from "./pages/HrDashChart.jsx";
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.jsx';

function App() {
    const { user, role, isFlagged, isAuthenticated } = useAuthStore();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to={"/dashboard"} replace />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to={"/dashboard"}/> : <Login />} />
                <Route path="/dashboard" element={
                    isAuthenticated ? (
                        <Layout>
                            {role === 'employee' ? <UserDashboard /> : <HrDashChart />}
                        </Layout>
                    ) : <Navigate to="/login" replace />
                } />
                <Route path="/chatbot" element={isAuthenticated ? <Layout><Chatbot /></Layout> : <Navigate to="/login" replace />} />
                <Route path="/messaging" element={isAuthenticated ? <Layout><Interaction /></Layout> : <Navigate to="/login" replace />} />
                <Route path="/profile" element={isAuthenticated ? <Layout><Profile /></Layout> : <Navigate to="/login" replace />} />
                <Route path="/employee" element={isAuthenticated ? <Layout><Employee /></Layout> : <Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : <Login />} replace />} />
            </Routes>
            <Toaster position="top-center" reverseOrder={false} />
        </BrowserRouter>
    );
}

export default App;
