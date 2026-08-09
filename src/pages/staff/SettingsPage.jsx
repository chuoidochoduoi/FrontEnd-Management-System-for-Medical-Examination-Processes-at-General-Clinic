import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { 
    Moon, Sun, Globe, Monitor, Printer, 
    Bell, Volume2, Keyboard, LayoutGrid, 
    ShieldAlert, Save 
} from 'lucide-react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';
import CashierLayout from '@/components/layout/CashierLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import { applyPreferences, persistPreferences } from '@/utils/appPreferences';

export default function SettingsPage() {
    const { t, i18n } = useTranslation('settings');
    const [saving, setSaving] = useState(false);

    // Lấy systemRole để render đúng Layout
    const systemRole = localStorage.getItem('systemRole') || sessionStorage.getItem('systemRole') || '';
    let Layout = ReceptionistLayout;
    if (systemRole === 'CLINIC_MANAGER') Layout = OwnerLayout;
    else if (systemRole === 'CASHIER') Layout = CashierLayout;
    else if (['DOCTOR', 'GENERAL_DOCTOR', 'SPECIALIST_DOCTOR', 'NURSE'].includes(systemRole)) Layout = MedicalStaffLayout;
    else if (systemRole === 'ADMIN') Layout = AdminLayout;

    // Các state cấu hình
    const [settings, setSettings] = useState({
        theme: localStorage.getItem('app_theme') || 'light',
        language: localStorage.getItem('app_lang') || 'vi',
        notifications: localStorage.getItem('app_notifications') !== 'false',
        sound: localStorage.getItem('app_sound') !== 'false',
        compact: localStorage.getItem('app_compact') === 'true',
    });

    useEffect(() => {
        applyPreferences(settings);
        i18n.changeLanguage(settings.language);
    }, [settings.theme, settings.language, settings.compact, i18n]);

    // Handle thay đổi settings
    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            persistPreferences(settings);
            localStorage.setItem('app_notifications', String(settings.notifications));
            localStorage.setItem('app_sound', String(settings.sound));
            
            // Apply language
            if (i18n && i18n.changeLanguage) {
                i18n.changeLanguage(settings.language);
            }

            toast.success(t('saved'));
            setSaving(false);
        }, 600);
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 min-h-screen bg-gray-50/50">
                <div className="max-w-4xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
                            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? t('saving') : t('save')}
                        </button>
                    </div>

                    <div className="max-w-2xl gap-6">
                        {/* Giao diện & Trải nghiệm */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                                <Monitor className="w-5 h-5 text-primary-500" />
                                {t('appearance')}
                            </h2>
                            
                            <div className="space-y-4">
                                {/* Theme */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{t('theme')}</p>
                                        <p className="text-xs text-gray-500">{t('themeHint')}</p>
                                    </div>
                                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                        <button 
                                            onClick={() => handleChange('theme', 'light')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Sun className="w-3.5 h-3.5" /> {t('light')}
                                        </button>
                                        <button 
                                            onClick={() => handleChange('theme', 'dark')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.theme === 'dark' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            <Moon className="w-3.5 h-3.5" /> {t('dark')}
                                        </button>
                                    </div>
                                </div>

                                {/* Language */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{t('language')}</p>
                                        <p className="text-xs text-gray-500">{t('languageHint')}</p>
                                    </div>
                                    <select 
                                        value={settings.language} 
                                        onChange={(e) => handleChange('language', e.target.value)}
                                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
                                    >
                                        <option value="vi">🇻🇳 {t('vietnamese')}</option>
                                        <option value="en">🇬🇧 {t('english')}</option>
                                    </select>
                                </div>

                                {[
                                    ['notifications', Bell, t('notifications'), t('notificationsHint')],
                                    ['sound', Volume2, t('sound'), t('soundHint')],
                                    ['compact', LayoutGrid, t('compact'), t('compactHint')],
                                ].map(([key, Icon, title, description]) => (
                                    <label key={key} className="flex items-center justify-between pt-3 border-t border-gray-50 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{title}</p>
                                                <p className="text-xs text-gray-500">{description}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={settings[key]}
                                            onChange={e => handleChange(key, e.target.checked)}
                                            className="w-4 h-4 accent-primary-600"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}
