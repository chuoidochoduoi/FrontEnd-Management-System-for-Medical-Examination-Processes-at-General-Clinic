import { Routes, Route } from 'react-router-dom'


// thêm page mới
import LoginPage from './pages/auth/LoginPage.jsx'
import LoginRegister from './pages/auth/RegisterPage.jsx'
import AppointmentPage from '@/pages/appointment/AppointmentPage';
import CheckInPage from '@/pages/receptionist/CheckInPage';
import AppointmentDetailPage from '@/pages/receptionist/AppointmentDetailPage';
import ProfilePage from '@/pages/customer/ProfilePage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import CreateTicketPage from '@/pages/receptionist/CreateTicketPage';
import InvoiceListPage from '@/pages/cashier/InvoiceListPage';

import {ROUTES} from "@/constants/routes.js";


function App() {
  return (
    <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginRegister />} />
        <Route path={ROUTES.APPOINTMENT} element={<AppointmentPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

        {/* Routes cho nhân viên - RECEPTIONIST, NURSE, DOCTOR, ADMIN được truy cập */}
        <Route path={ROUTES.RECEPTIONIST_CHECKIN} element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN']}>
                <CheckInPage />
            </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_APPOINTMENT_DETAIL} element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN']}>
                <AppointmentDetailPage />
            </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_CREATE_TICKET} element={
            <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN']}>
                <CreateTicketPage />
            </ProtectedRoute>

        } />

        <Route path={ROUTES.CASHIER_INVOICES} element={<InvoiceListPage />} />

    </Routes>
  )
}
export default App;
