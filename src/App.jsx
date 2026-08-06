import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


// thêm page mới
import LoginPage from './pages/auth/LoginPage.jsx'
import LoginRegister from './pages/auth/RegisterPage.jsx'
import AppointmentPage from '@/pages/appointment/AppointmentPage';
import CustomerAppointmentPage from '@/pages/customer/CustomerAppointmentPage';
import CheckInPage from '@/pages/receptionist/CheckInPage';
import AppointmentDetailPage from '@/pages/receptionist/AppointmentDetailPage';
import ProfilePage from '@/pages/customer/ProfilePage';
import MyAppointmentsPage from '@/pages/customer/MyAppointmentsPage';
import CustomerAppointmentDetailPage from '@/pages/customer/AppointmentDetailPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LandingPage from '@/pages/public/LandingPage';
import CreateTicketPage from '@/pages/receptionist/CreateTicketPage';
import InvoiceListPage from '@/pages/cashier/InvoiceListPage';
import InvoiceDetailPage from '@/pages/cashier/InvoiceDetailPage';
import InvoicePrintPage from '@/pages/cashier/InvoicePrintPage';
import ExaminationPage from '@/pages/doctor/ExaminationPage';
import PrescriptionPreviewPage from '@/pages/doctor/PrescriptionPreviewPage';
import ExamCompletionPage from '@/pages/doctor/ExamCompletionPage';
import MedicalRecordPrintPage from '@/pages/doctor/MedicalRecordPrintPage';
import DoctorDepartmentPage from '@/pages/doctor/DoctorDepartmentPage';
import RoomListPage from '@/pages/doctor/RoomListPage';
import LabTestPage from '@/pages/lab/LabTestPage.jsx';
import LabCallQueuePage from '@/pages/lab/LabCallQueuePage.jsx';
import RoomQueueDisplayPage from '@/pages/display/RoomQueueDisplayPage.jsx';
import LabDetailPage from '@/pages/lab/LabDetailPage';
import AccountManagementPage from '@/pages/admin/AccountManagementPage';
import ServiceManagementPage from '@/pages/admin/ServiceManagementPage';
import RoomManagementPage from '@/pages/admin/RoomManagementPage';
import SpecializationManagementPage from '@/pages/admin/SpecializationManagementPage';
import CapabilityManagementPage from '@/pages/admin/CapabilityManagementPage';
import AuditLogManagementPage from '@/pages/admin/AuditLogManagementPage';
import ShiftManagementPage from '@/pages/admin/ShiftManagementPage';
import SchedulePage from '@/pages/owner/SchedulePage';
import ReportPage from '@/pages/owner/ReportPage';
import MySchedulePage from '@/pages/staff/MySchedulePage';
import StaffProfilePage from '@/pages/staff/StaffProfilePage';
import SettingsPage from '@/pages/staff/SettingsPage';
import RecordsManagementPage from '@/pages/receptionist/RecordsManagementPage';
import PaymentHistoryPage from '@/pages/customer/PaymentHistoryPage';
import ReceiptDetailPage  from '@/pages/customer/ReceiptDetailPage';
import MedicalHistoryPage from '@/pages/customer/MedicalHistoryPage';
import VisitDetailPage    from '@/pages/customer/VisitDetailPage';
import FeedbackPage from '@/pages/staff/FeedbackPage';
import AttendancePage from '@/pages/staff/AttendancePage';
import AttendanceKioskPage from '@/pages/owner/AttendanceKioskPage';
import AttendanceManagementPage from '@/pages/owner/AttendanceManagementPage';
import PatientJourneyPage from '@/pages/staff/PatientJourneyPage';
import WaitingRoomPage from '@/pages/customer/WaitingRoomPage';
import {ROUTES} from "@/constants/routes.js";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginRegister />} />
        <Route path={ROUTES.APPOINTMENT} element={<AppointmentPage />} />

        {/* CUSTOMER routes - bệnh nhân */}
        <Route path={ROUTES.CUSTOMER_APPOINTMENT} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerAppointmentPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.PROFILE} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.MY_APPOINTMENTS} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MyAppointmentsPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CUSTOMER_APPOINTMENT_DETAIL} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerAppointmentDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CUSTOMER_VISIT_HISTORY} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MedicalHistoryPage />
          </ProtectedRoute>
        } />
        <Route path={`${ROUTES.CUSTOMER_VISIT_HISTORY}/:id`} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <VisitDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CUSTOMER_PAYMENT} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <PaymentHistoryPage />
          </ProtectedRoute>
        } />
        <Route path={`${ROUTES.CUSTOMER_PAYMENT}/:id`} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <ReceiptDetailPage />
          </ProtectedRoute>
        } />

        {/* Routes cho nhân viên - dựa trên systemRole */}
        {/* RECEPTIONIST - lễ tân */}
        <Route path={ROUTES.RECEPTIONIST_CHECKIN} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
            <CheckInPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_APPOINTMENT_DETAIL} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <AppointmentDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_CREATE_TICKET} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
            <CreateTicketPage />
          </ProtectedRoute>
        } />

        {/* CASHIER - thu ngân */}
        <Route path={ROUTES.CASHIER_INVOICES} element={
          <ProtectedRoute allowedRoles={['CASHIER']}>
            <InvoiceListPage />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.CASHIER_INVOICE_DETAIL}>
          <Route index element={
            <ProtectedRoute allowedRoles={['CASHIER']}>
              <InvoiceDetailPage />
            </ProtectedRoute>
          } />
          <Route path="print" element={
            <ProtectedRoute allowedRoles={['CASHIER']}>
              <InvoicePrintPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* DOCTOR + NURSE - bác sĩ/y tá */}
        <Route path={ROUTES.DOCTOR_ROOMS} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'CLINIC_MANAGER']}>
            <RoomListPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_DEPARTMENTS} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'CLINIC_MANAGER']}>
            <DoctorDepartmentPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_EXAMINATION} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <ExaminationPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_PRESCRIPTION_PREVIEW} element={
          <ProtectedRoute allowedRoles={['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <PrescriptionPreviewPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_EXAM_COMPLETED} element={<ProtectedRoute allowedRoles={['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}><ExamCompletionPage /></ProtectedRoute>} />
        <Route path={ROUTES.DOCTOR_MEDICAL_RECORD_PRINT} element={<ProtectedRoute allowedRoles={['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}><MedicalRecordPrintPage /></ProtectedRoute>} />
        <Route path={ROUTES.WAITING_ROOM} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><WaitingRoomPage /></ProtectedRoute>} />
        <Route path={ROUTES.PATIENT_JOURNEYS} element={<ProtectedRoute allowedRoles={['RECEPTIONIST','CLINIC_MANAGER']}><PatientJourneyPage /></ProtectedRoute>} />
        <Route path={ROUTES.DOCTOR_FEEDBACKS} element={<ProtectedRoute allowedRoles={['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}><FeedbackPage /></ProtectedRoute>} />

        {/* LAB - xét nghiệm (NURSE có thể truy cập) */}
        <Route path={ROUTES.DOCTOR_LAB} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <LabTestPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_LAB_DETAIL} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <LabDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_ACCOUNTS} element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AccountManagementPage />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.ADMIN_ROOMS} element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <RoomManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AuditLogManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_SHIFTS} element={
          <ProtectedRoute allowedRoles={['CLINIC_MANAGER']}>
            <ShiftManagementPage />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.ADMIN_SERVICES} element={<ServiceManagementPage />} />
        <Route path={ROUTES.ADMIN_SPECIALIZATIONS} element={<ProtectedRoute allowedRoles={['ADMIN']}><SpecializationManagementPage /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN_CAPABILITIES} element={<ProtectedRoute allowedRoles={['ADMIN']}><CapabilityManagementPage /></ProtectedRoute>} />
        <Route path={ROUTES.OWNER_SCHEDULE} element={
          <ProtectedRoute allowedRoles={['CLINIC_MANAGER']}>
            <SchedulePage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.OWNER_REPORT} element={
          <ProtectedRoute allowedRoles={['CLINIC_MANAGER']}>
            <ReportPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_LAB_CALL} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <LabCallQueuePage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ROOM_QUEUE_DISPLAY} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
            <RoomQueueDisplayPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ALL_QUEUE_DISPLAY} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'RECEPTIONIST', 'ADMIN']}>
            <RoomQueueDisplayPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.OWNER_FEEDBACKS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER']}><FeedbackPage /></ProtectedRoute>} />
//        <Route path={ROUTES.OWNER_ATTENDANCE} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER']}><AttendanceManagementPage /></ProtectedRoute>} />
//        <Route path={ROUTES.OWNER_ATTENDANCE_KIOSK} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER']}><AttendanceKioskPage /></ProtectedRoute>} />
//        <Route path={ROUTES.STAFF_ATTENDANCE} element={<ProtectedRoute allowedRoles={['RECEPTIONIST','CASHIER','DOCTOR','GENERAL_DOCTOR','SPECIALIST_DOCTOR','NURSE','CLINIC_MANAGER']}><AttendancePage /></ProtectedRoute>} />

      {/* Staff self schedule - receptionist, cashier, doctor, nurse */}
      <Route path={ROUTES.STAFF_SCHEDULE} element={
        <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CASHIER', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'NURSE', 'CLINIC_MANAGER']}>
          <MySchedulePage />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.STAFF_PROFILE} element={
        <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CASHIER', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'NURSE', 'CLINIC_MANAGER', 'ADMIN']}>
          <StaffProfilePage />
        </ProtectedRoute>
      } />
      <Route path={ROUTES.SETTINGS} element={
        <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CASHIER', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'NURSE', 'CLINIC_MANAGER', 'ADMIN']}>
          <SettingsPage />
        </ProtectedRoute>
      } />
        <Route path={ROUTES.RECEPTIONIST_RECORDS} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
            <RecordsManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_RECORD_DETAIL} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
            <div className="p-8">Trang chi tiết hồ sơ - đang phát triển</div>
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  )
}
export default App;
