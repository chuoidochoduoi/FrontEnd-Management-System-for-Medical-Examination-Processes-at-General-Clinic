import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import OwnerLayout from '@/components/layout/OwnerLayout';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';

const stored = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const statuses = ['WAITING', 'CALLED', 'IN_PROGRESS', 'WAITING_FOR_TEST', 'TEST_DONE', 'PENDING', 'COMPLETED', 'UNASSIGNED'];
const active = new Set(['WAITING', 'CALLED', 'IN_PROGRESS', 'WAITING_FOR_TEST', 'TEST_DONE', 'PENDING']);
const PAGE_SIZE = 8;

export default function PatientJourneyPage() {
    const { t, i18n } = useTranslation('operations');
    const isManager = stored('systemRole') === 'CLINIC_MANAGER';
    const Layout = isManager ? OwnerLayout : ReceptionistLayout;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [sort, setSort] = useState('newest');
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const label = value => t(`status.${value}`, { defaultValue: value || '-' });

    const load = async (nextPage = page, nextSearch = search, nextStatus = status) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(nextPage), size: String(PAGE_SIZE) });
            if (nextSearch.trim()) params.set('search', nextSearch.trim());
            if (nextStatus) params.set('status', nextStatus);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/patient-journeys?${params}`, { headers: { Authorization: `Bearer ${stored('token')}` } });
            const body = await response.json();
            if (!response.ok) throw new Error(body.message || t('journey.loadFailed'));
            const payload = body.data ?? body;
            setItems(payload.content ?? []);
            setTotal(payload.totalElements ?? 0);
            setPage(payload.page ?? nextPage);
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(0, '', ''); }, []);

    const advance = async (visitId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/patient-journeys/${visitId}/advance`, {
                method: 'POST', headers: { Authorization: `Bearer ${stored('token')}` }
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.message || 'Không thể tiếp tục hành trình.');
            toast.success('Đã đồng bộ bước hàng chờ tiếp theo.');
            load(page, search, status);
        } catch (error) { toast.error(error.message); }
    };

    const shown = useMemo(() => items
        .filter(item => (!search || `${item.patientName} ${item.phone || ''} ${item.visitCode}`.toLowerCase().includes(search.toLowerCase())) && (!status || item.currentStatus === status))
        .sort((a, b) => sort === 'waiting' ? b.waitingMinutes - a.waitingMinutes : sort === 'name' ? (a.patientName || '').localeCompare(b.patientName || '', i18n.language) : new Date(b.checkInTime) - new Date(a.checkInTime)),
    [items, search, status, sort, i18n.language]);

    const columns = ['patient', 'currentStep', 'location', 'status', 'waiting', 'nextStep', 'actions'];
    return <Layout><div className="w-full p-6 lg:p-8 overflow-y-auto space-y-5">
        <header className="flex flex-wrap justify-between gap-3">
            <div><h1 className="text-2xl font-bold text-gray-900">{t('journey.title')}</h1><p className="text-sm text-gray-500 mt-1">{t('journey.subtitle')}</p></div>
            <button onClick={() => load()} className="h-10 px-4 border rounded-xl flex items-center gap-2 text-sm"><RefreshCw size={16}/>{t('common.refresh')}</button>
        </header>
        <section className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-[1fr_210px_210px] gap-3">
            <label className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400"/><input value={search} onChange={e => { const value = e.target.value; setSearch(value); load(0, value, status); }} placeholder={t('journey.search')} className="w-full h-10 border rounded-lg pl-9 pr-3 text-sm"/></label>
            <select value={status} onChange={e => { const value = e.target.value; setStatus(value); load(0, search, value); }} className="h-10 border rounded-lg px-3 text-sm"><option value="">{t('common.allStatuses')}</option>{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
            <select value={sort} onChange={e => { setSort(e.target.value); load(0, search, status); }} className="h-10 border rounded-lg px-3 text-sm"><option value="newest">{t('journey.sortNewest')}</option><option value="waiting">{t('journey.sortWaiting')}</option><option value="name">{t('journey.sortName')}</option></select>
        </section>
        <section className="bg-white border rounded-xl overflow-x-auto"><table className="w-full min-w-[950px] text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr>{columns.map(key => <th key={key} className="text-left font-medium px-4 py-3">{t(`journey.columns.${key}`)}</th>)}</tr></thead>
            <tbody className="divide-y">{shown.map(item => <tr key={item.visitId} className={item.warning ? 'bg-amber-50/40' : ''}>
                <td className="px-4 py-4"><p className="font-semibold">{item.patientName || '-'}</p><p className="text-xs text-gray-500">{t(item.guest ? 'common.guest' : 'common.account')} · {item.phone || '-'} · {item.visitCode}</p></td>
                <td className="px-4">{item.currentStep || '-'}</td><td className="px-4">{item.currentRoom || '-'}</td>
                <td className="px-4"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs">{item.warning && <AlertTriangle size={13}/>} {label(item.currentStatus)}</span></td>
                <td className="px-4">{t('common.minutes', { count: item.waitingMinutes || 0 })}</td><td className="px-4">{item.nextStep || '-'}</td>
                <td className="px-4 whitespace-nowrap"><button onClick={() => advance(item.visitId)} className="mr-2 rounded-lg border border-teal-200 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50">Tiếp tục</button><button aria-label={t('journey.details')} onClick={() => setSelected(item)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={17}/></button></td>
            </tr>)}</tbody>
        </table>{!loading && !shown.length && <p className="p-12 text-center text-gray-400">{t('journey.empty')}</p>}{loading && <p className="p-12 text-center text-gray-400">{t('common.loading')}</p>}
            {total > 0 && <div className="flex items-center justify-between border-t px-4 py-3"><span className="text-xs text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}</span><div className="flex items-center gap-1"><button disabled={page === 0} onClick={() => load(page - 1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">‹</button>{Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, index) => index).slice(Math.max(0, page - 2), page + 3).map(index => <button key={index} onClick={() => load(index)} className={`rounded px-2.5 py-1 text-sm ${page === index ? 'bg-gray-900 text-white' : 'border'}`}>{index + 1}</button>)}<button disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => load(page + 1)} className="rounded border px-2 py-1 text-sm disabled:opacity-40">›</button></div></div>}
        </section>
        {selected && <div className="fixed inset-0 bg-black/40 z-50 flex justify-end"><aside className="bg-white h-full w-full max-w-xl p-6 overflow-y-auto">
            <div className="flex justify-between mb-6"><div><h2 className="text-xl font-bold">{selected.patientName}</h2><p className="text-sm text-gray-500">{selected.visitCode} · {t(selected.guest ? 'common.guest' : 'common.account')}</p></div><button onClick={() => setSelected(null)}><X/></button></div>
            <div>{(selected.steps || []).map((step, index) => <div key={step.id} className="flex gap-4"><div className="flex flex-col items-center"><span className={`w-4 h-4 rounded-full border-2 ${active.has(step.status) ? 'bg-blue-500 border-blue-500' : step.status === 'BLOCKED' ? 'bg-white border-gray-300' : 'bg-green-500 border-green-500'}`}/>{index < selected.steps.length - 1 && <span className="w-px h-20 bg-gray-200"/>}</div><div className="pb-8"><p className="font-semibold">{step.serviceName}</p><p className="text-sm text-gray-500">{step.roomName} ({step.roomCode || '-'})</p><p className="text-xs mt-1 text-blue-600">{label(step.status)}</p></div></div>)}</div>
        </aside></div>}
    </div></Layout>;
}
