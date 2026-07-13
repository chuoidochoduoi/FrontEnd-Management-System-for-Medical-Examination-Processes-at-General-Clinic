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
import InvoiceDetailPage from '@/pages/cashier/InvoiceDetailPage';
import InvoicePrintPage from '@/pages/cashier/InvoicePrintPage';
import ExaminationPage from '@/pages/doctor/ExaminationPage';
import DoctorDepartmentPage from '@/pages/doctor/DoctorDepartmentPage';

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

        {/* Cashier routes */}
        <Route path={ROUTES.CASHIER_INVOICES} element={
            <ProtectedRoute allowedRoles={['CASHIER', 'ADMIN']}>
                <InvoiceListPage />
            </ProtectedRoute>
        } />

        <Route path={ROUTES.CASHIER_INVOICE_DETAIL}>
            <Route index element={
                <ProtectedRoute allowedRoles={['CASHIER', 'ADMIN']}>
                    <InvoiceDetailPage />
                </ProtectedRoute>
            } />
            <Route path="print" element={
                <ProtectedRoute allowedRoles={['CASHIER', 'ADMIN']}>
                    <InvoicePrintPage />
                </ProtectedRoute>
            } />
        </Route>

        <Route path={ROUTES.DOCTOR_DEPARTMENTS} element={
            <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'ADMIN']}>
                <DoctorDepartmentPage />
            </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_EXAMINATION} element={<ExaminationPage />} />



    </Routes>
  )
}
export default App;
