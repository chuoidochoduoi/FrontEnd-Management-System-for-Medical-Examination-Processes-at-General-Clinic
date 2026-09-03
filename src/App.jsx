import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {ROUTES} from "@/constants/routes.js";

const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'))
const LoginRegister = lazy(() => import('./pages/auth/RegisterPage.jsx'))
const AppointmentPage = lazy(() => import('@/pages/appointment/AppointmentPage'))
const CustomerAppointmentPage = lazy(() => import('@/pages/customer/CustomerAppointmentPage'))
const FamilyMembersPage = lazy(() => import('@/pages/customer/FamilyMembersPage'))
const MembershipCardPage = lazy(() => import('@/pages/customer/MembershipCardPage'))
const CheckInPage = lazy(() => import('@/pages/receptionist/CheckInPage'))
const AppointmentDetailPage = lazy(() => import('@/pages/receptionist/AppointmentDetailPage'))
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'))
const MyAppointmentsPage = lazy(() => import('@/pages/customer/MyAppointmentsPage'))
const CustomerAppointmentDetailPage = lazy(() => import('@/pages/customer/AppointmentDetailPage'))
const PublicHomePage = lazy(() => import('@/pages/public/PublicHomePage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const TermsPage = lazy(() => import('@/pages/public/TermsPage'))
const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage'))
const PublicSchedulePage = lazy(() => import('@/pages/public/PublicSchedulePage'))
const PublicServicesPage = lazy(() => import('@/pages/public/PublicServicesPage'))
const PublicDoctorsPage = lazy(() => import('@/pages/public/PublicDoctorsPage'))
const CreateTicketPage = lazy(() => import('@/pages/receptionist/CreateTicketPage'))
const VisitManagementPage = lazy(() => import('@/pages/receptionist/VisitManagementPage'))
const InvoiceListPage = lazy(() => import('@/pages/cashier/InvoiceListPage'))
const InvoiceDetailPage = lazy(() => import('@/pages/cashier/InvoiceDetailPage'))
const InvoicePrintPage = lazy(() => import('@/pages/cashier/InvoicePrintPage'))
const MembershipTopUpPage = lazy(() => import('@/pages/cashier/MembershipTopUpPage'))
const MembershipTopUpHistoryPage = lazy(() => import('@/pages/cashier/MembershipTopUpHistoryPage'))
const ExaminationPage = lazy(() => import('@/pages/doctor/ExaminationPage'))
const PrescriptionPreviewPage = lazy(() => import('@/pages/doctor/PrescriptionPreviewPage'))
const ExamCompletionPage = lazy(() => import('@/pages/doctor/ExamCompletionPage'))
const MedicalRecordPrintPage = lazy(() => import('@/pages/doctor/MedicalRecordPrintPage'))
const ReceptionistSupportPage = lazy(() => import('@/pages/receptionist/ReceptionistSupportPage'))
const FollowUpListPage = lazy(() => import('@/pages/receptionist/FollowUpListPage'))
const DoctorDepartmentPage = lazy(() => import('@/pages/doctor/DoctorDepartmentPage'))
const RoomListPage = lazy(() => import('@/pages/doctor/RoomListPage'))
const LabRequestListPage = lazy(() => import('@/pages/lab/LabRequestListPage.jsx'))
const LabCallQueuePage = lazy(() => import('@/pages/lab/LabCallQueuePage.jsx'))
const RoomQueueDisplayPage = lazy(() => import('@/pages/display/RoomQueueDisplayPage.jsx'))
const QueueDisplayLauncherPage = lazy(() => import('@/pages/display/QueueDisplayLauncherPage.jsx'))
const LabDetailPage = lazy(() => import('@/pages/lab/LabDetailPage'))
const AccountManagementPage = lazy(() => import('@/pages/admin/AccountManagementPage'))
const ServiceManagementPage = lazy(() => import('@/pages/admin/ServiceManagementPage'))
const RoomManagementPage = lazy(() => import('@/pages/admin/RoomManagementPage'))
const CapabilityManagementPage = lazy(() => import('@/pages/admin/CapabilityManagementPage'))
const AuditLogManagementPage = lazy(() => import('@/pages/admin/AuditLogManagementPage'))
const PublicAnnouncementManagementPage = lazy(() => import('@/pages/admin/PublicAnnouncementManagementPage'))
const ClinicInformationPage = lazy(() => import('@/pages/admin/ClinicInformationPage'))
const ShiftManagementPage = lazy(() => import('@/pages/admin/ShiftManagementPage'))
const MembershipPolicyPage = lazy(() => import('@/pages/admin/MembershipPolicyPage'))
const SchedulePage = lazy(() => import('@/pages/owner/SchedulePage'))
const ReportPage = lazy(() => import('@/pages/owner/ReportPage'))
const MySchedulePage = lazy(() => import('@/pages/staff/MySchedulePage'))
const StaffProfilePage = lazy(() => import('@/pages/staff/StaffProfilePage'))
const SettingsPage = lazy(() => import('@/pages/staff/SettingsPage'))
const RecordsManagementPage = lazy(() => import('@/pages/receptionist/RecordsManagementPage'))
const PatientDetailPage = lazy(() => import('@/pages/receptionist/PatientDetailPage'))
const PatientVisitDetailPage = lazy(() => import('@/pages/receptionist/PatientVisitDetailPage'))
const RecordDetailPage = lazy(() => import('@/pages/receptionist/RecordDetailPage'))
const PaymentHistoryPage = lazy(() => import('@/pages/customer/PaymentHistoryPage'))
const ReceiptDetailPage = lazy(() => import('@/pages/customer/ReceiptDetailPage'))
const MedicalHistoryPage = lazy(() => import('@/pages/customer/MedicalHistoryPage'))
const VisitDetailPage = lazy(() => import('@/pages/customer/VisitDetailPage'))
const FeedbackPage = lazy(() => import('@/pages/staff/FeedbackPage'))
const PatientJourneyPage = lazy(() => import('@/pages/staff/PatientJourneyPage'))
const WaitingRoomPage = lazy(() => import('@/pages/customer/WaitingRoomPage'))
const GuestJourneyPage = lazy(() => import('@/pages/guest/GuestJourneyPage'))
const ManagerStaffPage = lazy(() => import('@/pages/owner/ManagerStaffPage'))
const ManagerPatientsPage = lazy(() => import('@/pages/owner/ManagerPatientsPage'))
const ClinicalFormTemplatePage = lazy(() => import('@/pages/owner/ClinicalFormTemplatePage'))


function App() {
  return (
    <>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-base font-semibold text-slate-600">Đang tải trang...</div>}>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/schedule" element={<PublicSchedulePage />} />
        <Route path="/services" element={<PublicServicesPage />} />
        <Route path="/doctors" element={<PublicDoctorsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginRegister />} />
        <Route path={ROUTES.APPOINTMENT} element={<AppointmentPage />} />
        <Route path={ROUTES.GUEST_JOURNEY} element={<GuestJourneyPage />} />

        {/* CUSTOMER routes - bệnh nhân */}
        <Route path={ROUTES.CUSTOMER_APPOINTMENT} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerAppointmentPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CUSTOMER_FAMILY_MEMBERS} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <FamilyMembersPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CUSTOMER_MEMBERSHIP_CARD} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}><MembershipCardPage /></ProtectedRoute>
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
        <Route path={ROUTES.CUSTOMER_MEDICAL_RECORD_PRINT} element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MedicalRecordPrintPage />
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
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <CheckInPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_APPOINTMENT_DETAIL} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'CLINIC_MANAGER']}>
            <AppointmentDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_CREATE_TICKET} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <CreateTicketPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_VISITS} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <VisitManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_FOLLOW_UPS} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <FollowUpListPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_SUPPORT} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <ReceptionistSupportPage />
          </ProtectedRoute>
        } />
        {/* CASHIER - thu ngân */}
        <Route path={ROUTES.CASHIER_INVOICES} element={
          <ProtectedRoute allowedRoles={['CASHIER', 'CLINIC_MANAGER']}>
            <InvoiceListPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CASHIER_MEMBERSHIP_TOPUP} element={
          <ProtectedRoute allowedRoles={['CASHIER', 'CLINIC_MANAGER']}><MembershipTopUpPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.CASHIER_MEMBERSHIP_TOPUP_HISTORY} element={
          <ProtectedRoute allowedRoles={['CASHIER', 'CLINIC_MANAGER']}><MembershipTopUpHistoryPage /></ProtectedRoute>
        } />

        <Route path={ROUTES.CASHIER_INVOICE_DETAIL}>
          <Route index element={
            <ProtectedRoute allowedRoles={['CASHIER', 'CLINIC_MANAGER']}>
              <InvoiceDetailPage />
            </ProtectedRoute>
          } />
          <Route path="print" element={
            <ProtectedRoute allowedRoles={['CASHIER', 'CLINIC_MANAGER']}>
              <InvoicePrintPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* DOCTOR + NURSE - bác sĩ/y tá */}
        <Route path={ROUTES.DOCTOR_ROOMS} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <RoomListPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_DEPARTMENTS} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
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
        <Route path={ROUTES.DOCTOR_MEDICAL_RECORD_PRINT} element={<ProtectedRoute allowedRoles={['CUSTOMER', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}><MedicalRecordPrintPage /></ProtectedRoute>} />
        <Route path={ROUTES.WAITING_ROOM} element={<ProtectedRoute allowedRoles={['CUSTOMER']}><WaitingRoomPage /></ProtectedRoute>} />
        <Route path={ROUTES.PATIENT_JOURNEYS} element={<ProtectedRoute allowedRoles={['RECEPTIONIST','CLINIC_MANAGER']}><PatientJourneyPage /></ProtectedRoute>} />
        <Route path={ROUTES.RECEPTIONIST_FEEDBACKS} element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}><FeedbackPage /></ProtectedRoute>} />

        {/* LAB - xét nghiệm (NURSE có thể truy cập) */}
        <Route path={ROUTES.DOCTOR_LAB} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <LabRequestListPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.DOCTOR_LAB_DETAIL} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR']}>
            <LabDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_ACCOUNTS} element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}>
            <AccountManagementPage />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.ADMIN_ROOMS} element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}>
            <RoomManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}>
            <AuditLogManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_SHIFTS} element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}>
            <ShiftManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_PUBLIC_ANNOUNCEMENTS} element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}>
            <PublicAnnouncementManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_CLINIC_INFORMATION} element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}>
            <ClinicInformationPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_MEMBERSHIP_POLICY} element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}><MembershipPolicyPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.CLINICAL_FORM_TEMPLATES} element={
          <ProtectedRoute allowedRoles={['CLINIC_MANAGER']}>
            <ClinicalFormTemplatePage />
          </ProtectedRoute>
        } />

        <Route path={ROUTES.ADMIN_SERVICES} element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}><ServiceManagementPage /></ProtectedRoute>} />
        <Route path={ROUTES.ADMIN_CAPABILITIES} element={<ProtectedRoute allowedRoles={['ADMIN', 'CLINIC_MANAGER']}><CapabilityManagementPage /></ProtectedRoute>} />
        <Route path={ROUTES.OWNER_SCHEDULE} element={
          <ProtectedRoute allowedRoles={['CLINIC_MANAGER']}>
            <SchedulePage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ADMIN_SCHEDULE} element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
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
        <Route path={ROUTES.QUEUE_DISPLAY_LAUNCHER} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <QueueDisplayLauncherPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ROOM_QUEUE_DISPLAY} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'RECEPTIONIST', 'ADMIN', 'CLINIC_MANAGER']}>
            <RoomQueueDisplayPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ALL_QUEUE_DISPLAY} element={
          <ProtectedRoute allowedRoles={['NURSE', 'DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'RECEPTIONIST', 'ADMIN', 'CLINIC_MANAGER']}>
            <RoomQueueDisplayPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.MANAGER_STAFF} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER']}><ManagerStaffPage /></ProtectedRoute>} />
        <Route path={ROUTES.MANAGER_PATIENTS} element={<ProtectedRoute allowedRoles={['CLINIC_MANAGER']}><ManagerPatientsPage /></ProtectedRoute>} />
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
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <RecordsManagementPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_PATIENT_DETAIL} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <PatientDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_PATIENT_VISIT_DETAIL} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <PatientVisitDetailPage />
          </ProtectedRoute>
        } />
        <Route path={ROUTES.RECEPTIONIST_RECORD_DETAIL} element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'CLINIC_MANAGER']}>
            <RecordDetailPage />
          </ProtectedRoute>
        } />
      </Routes>
      </Suspense>
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
