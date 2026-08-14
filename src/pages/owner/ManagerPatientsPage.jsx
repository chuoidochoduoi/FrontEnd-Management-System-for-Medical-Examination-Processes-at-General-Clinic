import { useEffect, useState } from 'react';
import { Eye, Search, UserRound, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OwnerLayout from '@/components/layout/OwnerLayout';

const PAGE_SIZE = 7;
const token = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const formatDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : '-';
const formatBloodType = value => ({
    A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
    O_POSITIVE: 'O+', O_NEGATIVE: 'O-', AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
}[value] || value || '-');

function PatientModal({ patient, onClose, t }) {
    if (!patient) return null;
    const gender = patient.gender === 'MALE' ? t('male') : patient.gender === 'FEMALE' ? t('female') : '-';
    const fields = [
        [t('columns.code'), patient.patientCode], [t('columns.name'), patient.fullName],
        [t('columns.birth'), formatDate(patient.dateOfBirth)], [t('columns.gender'), gender],
        [t('columns.phone'), patient.phone], [t('columns.email'), patient.email],
        [t('bloodType'), formatBloodType(patient.bloodType)], [t('columns.address'), patient.address],
    ];
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><UserRound size={20}/></div><h2 className="font-bold text-gray-900">{t('detail')}</h2></div>
                <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-6 sm:grid-cols-2">{fields.map(([label, value]) =>
                <div key={label} className={label === t('columns.address') ? 'min-w-0 sm:col-span-2' : 'min-w-0'}><p className="text-xs text-gray-400">{label}</p><p className="mt-1 break-words [overflow-wrap:anywhere] text-sm font-medium text-gray-800">{value || '-'}</p></div>
            )}</div>
            <div className="flex justify-end border-t border-gray-100 px-6 py-4"><button onClick={onClose} className="h-10 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-700">{t('close')}</button></div>
        </div>
    </div>;
}

export default function ManagerPatientsPage() {
    const { t } = useTranslation('managerPatients');
    const [items, setItems] = useState([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(0);
    const [search, setSearch] = useState(''); const [genderFilter, setGenderFilter] = useState(''); const [age, setAge] = useState('');
    const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [selected, setSelected] = useState(null);

    const load = async (nextPage = 0) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams({ page: String(nextPage), size: String(PAGE_SIZE) });
            if (search.trim()) params.set('search', search.trim());
            if (genderFilter) params.set('gender', genderFilter === 'MALE' ? 'Nam' : 'Nữ');
            if (age) params.set('age', age);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/clinic-manager/patients?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
            const data = await response.json().catch(() => null);
            if (!response.ok) throw new Error(data?.message || t('loadFailed'));
            const payload = data?.data ?? data ?? {};
            setItems(payload.content ?? payload.items ?? []); setTotal(payload.totalElements ?? payload.total ?? 0); setPage(payload.page ?? nextPage);
        } catch (requestError) { setError(requestError.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(0); }, []);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const genderLabel = value => value === 'MALE' ? t('male') : value === 'FEMALE' ? t('female') : '-';

    return <OwnerLayout><div className="px-6 py-6 lg:px-8">
        <div className="mb-5"><h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1><p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p></div>
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-4 md:grid-cols-[1fr_180px_180px_auto]">
                <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === 'Enter' && load(0)} placeholder={t('searchPlaceholder')} className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary-400"/></div>
                <select value={genderFilter} onChange={event => setGenderFilter(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none"><option value="">{t('allGenders')}</option><option value="MALE">{t('male')}</option><option value="FEMALE">{t('female')}</option></select>
                <select value={age} onChange={event => setAge(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none"><option value="">{t('allAges')}</option>{['0-18','19-40','41-60','60+'].map(value => <option key={value} value={value}>{value}</option>)}</select>
                <button onClick={() => load(0)} className="h-10 rounded-xl bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-700">{t('filter')}</button>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[1100px]"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">{t('columns.code')}</th><th className="px-4 py-3">{t('columns.name')}</th><th className="px-4 py-3">{t('columns.birthGender')}</th><th className="px-4 py-3">{t('columns.phone')}</th><th className="px-4 py-3">{t('columns.email')}</th><th className="px-4 py-3">{t('columns.address')}</th><th className="px-4 py-3 text-right">{t('columns.actions')}</th></tr></thead><tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan="7" className="px-4 py-12 text-center text-sm text-gray-400">{t('loading')}</td></tr> : error ? <tr><td colSpan="7" className="px-4 py-12 text-center text-sm text-red-600">{error}</td></tr> : items.length === 0 ? <tr><td colSpan="7" className="px-4 py-12 text-center text-sm text-gray-400">{t('empty')}</td></tr> : items.map(patient => <tr key={patient.customerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{patient.patientCode || '-'}</td><td className="max-w-[220px] px-4 py-3 text-sm font-semibold text-gray-900"><span className="block break-words [overflow-wrap:anywhere]">{patient.fullName || '-'}</span></td><td className="px-4 py-3 text-sm text-gray-600"><p>{formatDate(patient.dateOfBirth)}</p><p className="mt-0.5 text-xs text-gray-400">{genderLabel(patient.gender)}</p></td><td className="px-4 py-3 text-sm text-gray-700">{patient.phone || '-'}</td><td className="max-w-[210px] px-4 py-3 text-sm text-gray-600"><span className="block break-words [overflow-wrap:anywhere]">{patient.email || '-'}</span></td><td className="max-w-[240px] px-4 py-3 text-sm text-gray-600"><span className="line-clamp-2 break-words">{patient.address || '-'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => setSelected(patient)} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"><Eye size={15}/>{t('viewDetail')}</button></td>
                </tr>)}</tbody></table></div>
            {total > 0 && <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3"><p className="text-xs text-gray-500">{t('showing', { from: page * PAGE_SIZE + 1, to: Math.min((page + 1) * PAGE_SIZE, total), total })}</p><div className="flex items-center gap-2"><button disabled={page === 0 || loading} onClick={() => load(page - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">{t('previous')}</button><span className="px-2 text-sm text-gray-600">{page + 1}/{totalPages}</span><button disabled={page + 1 >= totalPages || loading} onClick={() => load(page + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">{t('next')}</button></div></div>}
        </section><PatientModal patient={selected} onClose={() => setSelected(null)} t={t}/>
    </div></OwnerLayout>;
}
