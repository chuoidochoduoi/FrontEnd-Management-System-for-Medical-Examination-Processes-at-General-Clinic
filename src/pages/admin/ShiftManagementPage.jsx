import { useEffect, useMemo, useState } from 'react';
import { Calendar, CalendarClock, Check, Clock, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';

const get = key => localStorage.getItem(key) || sessionStorage.getItem(key);
const headers = () => ({ Authorization: `Bearer ${get('token')}` });
const timeOptions = Array.from({ length: 48 }, (_, index) => {
    const hour = String(Math.floor(index / 2)).padStart(2, '0');
    return `${hour}:${index % 2 ? '30' : '00'}`;
});

export default function ShiftManagementPage() {
    const { t, i18n } = useTranslation('shiftManagement');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ name: '', startTime: '', endTime: '', isActive: true });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('startTime-asc');

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts`, { headers: headers() });
            if (!res.ok) throw new Error(t('messages.loadFailed'));
            const data = await res.json();
            setItems(Array.isArray(data) ? data : (data.data || []));
        } catch (error) { toast.error(error.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing({});
        setForm({ name: '', startTime: '', endTime: '', isActive: true });
    };
    const openEdit = item => {
        setEditing(item);
        setForm({ name: item.name || '', startTime: item.startTime || '', endTime: item.endTime || '', isActive: item.isActive !== false });
    };

    const save = async () => {
        if (!form.name.trim()) return toast.error(t('validation.name'));
        if (!form.startTime) return toast.error(t('validation.startTime'));
        if (!form.endTime) return toast.error(t('validation.endTime'));
        if (form.startTime >= form.endTime) return toast.error(t('validation.timeRange'));
        setSaving(true);
        try {
            const isEdit = Boolean(editing.shiftId);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts${isEdit ? `/${editing.shiftId}` : ''}`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: { ...headers(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, name: form.name.trim() })
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || t('messages.saveFailed'));
            toast.success(t(isEdit ? 'messages.updateSuccess' : 'messages.createSuccess'));
            setEditing(null);
            await load();
        } catch (error) { toast.error(error.message); }
        finally { setSaving(false); }
    };

    const remove = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/shifts/${deleting.shiftId}`, { method: 'DELETE', headers: headers() });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.message || t('messages.deleteFailed'));
            toast.success(t('messages.deleteSuccess'));
            setDeleting(null);
            await load();
        } catch (error) { toast.error(error.message); setDeleting(null); }
    };

    const visibleItems = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase(i18n.language);
        const toMinutes = value => {
            const [hour = 0, minute = 0] = String(value || '').split(':').map(Number);
            return hour * 60 + minute;
        };
        const filtered = items.filter(item => !keyword
            || item.name?.toLocaleLowerCase(i18n.language).includes(keyword));

        return [...filtered].sort((a, b) => {
            if (sort === 'startTime-asc') return toMinutes(a.startTime) - toMinutes(b.startTime);
            if (sort === 'startTime-desc') return toMinutes(b.startTime) - toMinutes(a.startTime);
            const result = (a.name || '').localeCompare(b.name || '', i18n.language, { sensitivity: 'base' });
            return sort === 'name-desc' ? -result : result;
        });
    }, [items, search, sort, i18n.language]);

    return <AdminLayout>
        <div className="px-10 py-8 space-y-8 max-w-7xl mx-auto">
            <section className="flex justify-between items-start bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600"><CalendarClock size={24} /></div>
                    <div><h1 className="text-lg font-bold text-gray-900">{t('title')}</h1><p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p></div>
                </div>
                <button onClick={openCreate} className="h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm flex items-center gap-2"><Plus size={18} />{t('add')}</button>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4 shadow-sm items-end">
                <div className="flex-1"><label className="block text-xs font-medium text-gray-500 mb-2">{t('searchLabel')}</label><div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-xl text-sm outline-none" placeholder={t('searchPlaceholder')} />
                </div></div>
                <div className="w-56"><label className="block text-xs font-medium text-gray-500 mb-2">{t('sortLabel')}</label>
                    <select value={sort} onChange={e => setSort(e.target.value)} className="w-full h-10 px-4 border border-gray-200 rounded-xl text-sm bg-white outline-none">
                        <option value="startTime-asc">{t('sort.startAsc')}</option><option value="startTime-desc">{t('sort.startDesc')}</option>
                        <option value="name-asc">{t('sort.nameAsc')}</option><option value="name-desc">{t('sort.nameDesc')}</option>
                    </select>
                </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-[1fr_1.5fr_1fr_100px] bg-gray-50/80 border-b border-gray-200 px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    <span>{t('table.name')}</span><span>{t('table.time')}</span><span>{t('table.status')}</span><span className="text-right">{t('table.actions')}</span>
                </div>
                {loading ? <div className="flex flex-col items-center py-20 text-gray-400 gap-4"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/><p className="text-sm">{t('loading')}</p></div>
                    : visibleItems.length === 0 ? <div className="flex flex-col items-center py-20 text-center"><div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300"><Calendar size={32}/></div><h3 className="text-sm font-medium text-gray-900">{t('emptyTitle')}</h3><p className="text-sm text-gray-400 my-2">{t('emptyHint')}</p><button onClick={openCreate} className="text-sm text-primary-600 font-medium flex items-center gap-1"><Plus size={16}/>{t('addFirst')}</button></div>
                    : <div className="divide-y divide-gray-100">{visibleItems.map(item => <div key={item.shiftId} className="grid grid-cols-[1fr_1.5fr_1fr_100px] px-6 py-4 items-center hover:bg-gray-50/50">
                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Clock size={16}/></div><span className="text-sm font-semibold text-gray-900">{item.name}</span></div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><span className="bg-gray-100 px-2 py-1 rounded-md">{item.startTime}</span><span>—</span><span className="bg-gray-100 px-2 py-1 rounded-md">{item.endTime}</span></div>
                        <div><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}><span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400'}`}/>{t(item.isActive ? 'status.active' : 'status.inactive')}</span></div>
                        <div className="flex justify-end gap-2"><button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-primary-600" title={t('actions.edit')}><Pencil size={16}/></button><button onClick={() => setDeleting(item)} className="p-2 text-gray-400 hover:text-red-600" title={t('actions.delete')}><Trash2 size={16}/></button></div>
                    </div>)}</div>}
            </section>

            {editing && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center"><h2 className="font-bold text-gray-900">{t(editing.shiftId ? 'modal.editTitle' : 'modal.createTitle')}</h2><button onClick={() => setEditing(null)}><X size={20}/></button></div>
                <div className="p-6 space-y-5"><div><label className="block text-sm font-medium text-gray-700 mb-1.5">{t('modal.name')} *</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm" placeholder={t('modal.namePlaceholder')}/></div>
                    <div className="grid grid-cols-2 gap-4">{['startTime', 'endTime'].map(field => <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1.5">{t(`modal.${field}`)} *</label><select value={form[field]} onChange={e => setForm(p => ({...p, [field]: e.target.value}))} className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm bg-white"><option value="">{t('modal.selectTime')}</option>{timeOptions.map(time => <option key={`${field}-${time}`} value={time}>{time}</option>)}</select></div>)}</div>
                    <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))}/><div><p className="text-sm font-medium text-gray-800">{t('modal.activeLabel')}</p><p className="text-xs text-gray-500">{t('modal.activeHint')}</p></div></label>
                </div>
                <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setEditing(null)} className="px-5 h-10 text-sm text-gray-600">{t('modal.cancel')}</button><button disabled={saving} onClick={save} className="h-10 px-6 bg-primary-600 text-white rounded-xl text-sm flex items-center gap-2">{saving ? t('modal.saving') : <><Check size={16}/>{t('modal.save')}</>}</button></div>
            </div></div>}

            <ConfirmModal isOpen={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title={t('deleteModal.title')} message={t('deleteModal.message', { name: deleting?.name || '' })} confirmText={t('deleteModal.confirm')} isDanger />
        </div>
    </AdminLayout>;
}
