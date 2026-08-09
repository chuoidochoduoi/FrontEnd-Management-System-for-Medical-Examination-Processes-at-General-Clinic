import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import OwnerLayout from '@/components/layout/OwnerLayout';
import MedicalStaffLayout from '@/components/layout/MedicalStaffLayout';

const stored = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const apiUrl = import.meta.env.VITE_API_URL;
const statuses = ['NEW', 'PROCESSING', 'RESPONDED', 'CLOSED'];

export default function FeedbackPage() {
    const { t, i18n } = useTranslation('operations');
    const isManager = stored('systemRole') === 'CLINIC_MANAGER';
    const Layout = isManager ? OwnerLayout : MedicalStaffLayout;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('ALL');
    const [drafts, setDrafts] = useState({});
    const label = value => t(`status.${value}`, { defaultValue: value });

    const request = useCallback(async (url, options = {}) => {
        const response = await fetch(`${apiUrl}${url}`, { ...options, headers: { Authorization: `Bearer ${stored('token')}`, 'Content-Type': 'application/json', ...options.headers } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || t('feedback.requestFailed'));
        return body.data ?? body;
    }, [t]);
    const load = useCallback(async () => {
        setLoading(true);
        try { const data = await request('/api/v1/feedbacks?page=0&size=100&sort=ratedAt,desc'); setItems(data.content ?? []); }
        catch (error) { toast.error(error.message); } finally { setLoading(false); }
    }, [request]);
    useEffect(() => { load(); }, [load]);
    const change = (id, field, value) => setDrafts(old => ({ ...old, [id]: { ...old[id], [field]: value } }));
    const save = async item => {
        const draft = drafts[item.recordId] ?? {};
        const url = isManager ? `/api/v1/feedbacks/${item.recordId}/respond` : `/api/v1/feedbacks/${item.recordId}/explain`;
        const payload = isManager
            ? { response: draft.response ?? item.managerResponse ?? '', internalNote: draft.internalNote ?? item.internalNote ?? '', status: draft.status ?? item.status ?? 'PROCESSING' }
            : { explanation: draft.explanation ?? item.doctorExplanation ?? '' };
        try { await request(url, { method: 'PUT', body: JSON.stringify(payload) }); toast.success(t('feedback.updated')); await load(); }
        catch (error) { toast.error(error.message); }
    };
    const visible = status === 'ALL' ? items : items.filter(item => (item.status || 'NEW') === status);
    const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';

    return <Layout><div className="w-full p-6 lg:p-8 space-y-5 overflow-y-auto">
        <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">{t('feedback.title')}</h1><p className="text-sm text-gray-500 mt-1">{t(isManager ? 'feedback.managerSubtitle' : 'feedback.doctorSubtitle')}</p></div><button onClick={load} className="h-10 px-4 border rounded-xl flex items-center gap-2 text-sm"><RefreshCw size={16}/>{t('common.refresh')}</button></header>
        <nav className="flex flex-wrap gap-2"><button onClick={() => setStatus('ALL')} className={`px-3 py-2 rounded-lg text-sm border ${status === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white'}`}>{t('feedback.all')}</button>{statuses.map(value => <button key={value} onClick={() => setStatus(value)} className={`px-3 py-2 rounded-lg text-sm border ${status === value ? 'bg-gray-900 text-white' : 'bg-white'}`}>{label(value)}</button>)}</nav>
        {loading && <p className="text-sm text-gray-500">{t('feedback.loading')}</p>}
        {!loading && !visible.length && <div className="bg-white border rounded-xl p-12 text-center text-gray-400"><MessageSquare className="mx-auto mb-2"/>{t('feedback.empty')}</div>}
        <div className="space-y-4">{visible.map(item => <article key={item.recordId} className="bg-white border rounded-2xl p-5">
            <div className="flex flex-wrap justify-between gap-3 border-b pb-4 mb-4"><div><p className="font-semibold">{item.patientName || '-'} · {item.serviceName || '-'}</p><p className="text-xs text-gray-500 mt-1">{t('feedback.doctor')}: {item.doctorName || '-'} · {item.ratedAt ? new Date(item.ratedAt).toLocaleString(locale) : '-'}</p></div><div className="flex gap-1 text-yellow-500 font-semibold"><Star size={17} fill="currentColor"/>{item.overallRating}/5</div></div>
            <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4 whitespace-pre-wrap">{item.comment || t('feedback.noComment')}</div>
            {isManager ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <textarea rows={3} value={drafts[item.recordId]?.response ?? item.managerResponse ?? ''} onChange={e => change(item.recordId, 'response', e.target.value)} placeholder={t('feedback.responsePlaceholder')} className="border rounded-xl p-3 text-sm"/>
                <textarea rows={3} value={drafts[item.recordId]?.internalNote ?? item.internalNote ?? ''} onChange={e => change(item.recordId, 'internalNote', e.target.value)} placeholder={t('feedback.internalPlaceholder')} className="border rounded-xl p-3 text-sm"/>
                {item.doctorExplanation && <div className="lg:col-span-2 text-sm bg-blue-50 p-3 rounded-xl"><b>{t('feedback.doctorExplanation')}</b> {item.doctorExplanation}</div>}
                <select value={drafts[item.recordId]?.status ?? item.status ?? 'NEW'} onChange={e => change(item.recordId, 'status', e.target.value)} className="border rounded-xl px-3 h-10 text-sm">{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
                <button onClick={() => save(item)} className="h-10 rounded-xl bg-gray-900 text-white text-sm">{t('feedback.save')}</button>
            </div> : <div className="space-y-3"><textarea rows={3} value={drafts[item.recordId]?.explanation ?? item.doctorExplanation ?? ''} onChange={e => change(item.recordId, 'explanation', e.target.value)} placeholder={t('feedback.explanationPlaceholder')} className="w-full border rounded-xl p-3 text-sm"/><button onClick={() => save(item)} className="px-5 h-10 rounded-xl bg-gray-900 text-white text-sm">{t('feedback.sendExplanation')}</button></div>}
        </article>)}</div>
    </div></Layout>;
}
