import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import viCommon from './locales/vi/common.json';
import viAuth   from './locales/vi/auth.json';
import enCommon from './locales/en/common.json';
import enAuth   from './locales/en/auth.json';
import viAppointment from './locales/vi/appointment.json';
import viAppointments from './locales/vi/appointments.json';
import viReceptionist from './locales/vi/receptionist.json';
import viCustomer from './locales/vi/customer.json';
import viCreateTicketConfirmModal from './locales/vi/createTicketConfirmModal.json';
import viCashier from './locales/vi/cashier.json';
import viQueue from './locales/vi/queue.json';
import enQueue from './locales/en/queue.json';
import viDoctor from './locales/vi/doctor.json';
import viLab from './locales/vi/lab.json';
import viAdmin from './locales/vi/admin.json';
import viServices from './locales/vi/services.json';
import viRooms from './locales/vi/rooms.json';
import viSchedule from './locales/vi/schedule.json';
import viReport from './locales/vi/report.json';
import viPayment from './locales/vi/payment.json';
import viMedicalHistory from './locales/vi/medicalHistory.json';
import enPayment from './locales/en/payment.json';
import enAppointments from './locales/en/appointments.json';
import enMedicalHistory from './locales/en/medicalHistory.json';

// Thêm page mới thì import thêm ở đây, ví dụ:
// import viCustomer from '../locales/vi/customer.json';
// import enCustomer from '../locales/en/customer.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'vi',
        debug: false,
        resources: {
            vi: {
                common: viCommon,
                auth:   viAuth,
                appointment: viAppointment,
                appointments: viAppointments,
                receptionist: viReceptionist,
                customer: viCustomer,
                createTicketConfirmModal: viCreateTicketConfirmModal,
                cashier: viCashier,
                queue: viQueue, doctor: viDoctor, lab: viLab, admin: viAdmin, services: viServices, rooms: viRooms, schedule: viSchedule, report: viReport, payment: viPayment, medicalHistory: viMedicalHistory
            },
            en: {
                common: enCommon,
                auth:   enAuth,
                queue: enQueue,
                payment: enPayment, appointments: enAppointments, medicalHistory: enMedicalHistory
            },
        },
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;