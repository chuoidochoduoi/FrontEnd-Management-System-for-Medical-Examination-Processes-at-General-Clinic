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
import enSchedule from './locales/en/schedule.json';
import viReport from './locales/vi/report.json';
import viPayment from './locales/vi/payment.json';
import viMedicalHistory from './locales/vi/medicalHistory.json';
import viDepartments from './locales/vi/departments.json';
import enPayment from './locales/en/payment.json';
import enAppointments from './locales/en/appointments.json';
import enMedicalHistory from './locales/en/medicalHistory.json';
import enDoctor from './locales/en/doctor.json';
import viSettings from './locales/vi/settings.json';
import enSettings from './locales/en/settings.json';
import viLanding from './locales/vi/landing.json';
import enLanding from './locales/en/landing.json';
import viShiftManagement from './locales/vi/shiftManagement.json';
import enShiftManagement from './locales/en/shiftManagement.json';
import viOperations from './locales/vi/operations.json';
import enOperations from './locales/en/operations.json';
import createEnglishResource from './locales/createEnglishResource';

// Thêm page mới thì import thêm ở đây, ví dụ:
// import viCustomer from '../locales/vi/customer.json';
// import enCustomer from '../locales/en/customer.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'vi',
        supportedLngs: ['vi', 'en'],
        load: 'languageOnly',
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
                queue: viQueue, doctor: viDoctor, lab: viLab, admin: viAdmin, services: viServices, rooms: viRooms, schedule: viSchedule, report: viReport, payment: viPayment, medicalHistory: viMedicalHistory, departments: viDepartments, settings: viSettings, landing: viLanding, shiftManagement: viShiftManagement, operations: viOperations
            },
            en: {
                common: enCommon,
                auth:   enAuth,
                appointment: createEnglishResource(viAppointment),
                receptionist: createEnglishResource(viReceptionist),
                customer: createEnglishResource(viCustomer),
                createTicketConfirmModal: createEnglishResource(viCreateTicketConfirmModal),
                cashier: createEnglishResource(viCashier),
                queue: enQueue,
                payment: enPayment, appointments: enAppointments, medicalHistory: enMedicalHistory,
                doctor: enDoctor,
                lab: createEnglishResource(viLab),
                admin: createEnglishResource(viAdmin),
                services: createEnglishResource(viServices),
                rooms: createEnglishResource(viRooms),
                schedule: enSchedule,
                report: createEnglishResource(viReport),
                departments: createEnglishResource(viDepartments),
                settings: enSettings, landing: enLanding, shiftManagement: enShiftManagement, operations: enOperations
            },
        },
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'app_lang',
        },
    });

export default i18n;
