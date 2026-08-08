// src/pages/manager/ManagerStaffPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, User, Shield, Stethoscope, Phone, Mail, ChevronsUpDown } from 'lucide-react';
import OwnerLayout from '@/components/layout/OwnerLayout';

const get    = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const bearer = ()    => ({ Authorization: `Bearer ${get('token')}` });
const PAGE_SIZE = 12;

const ROLE_OPTIONS = [
    { value: '',               label: 'Tat ca vai tro' },
    { value: 'DOCTOR',         label: 'Bac si' },
    { value: 'NURSE',          label: 'Y ta' },
    { value: 'RECEPTIONIST',   label: 'Le tan' },
    { value: 'CASHIER',        label: 'Thu ngan' },
    { value: 'CLINIC_MANAGER', label: 'Quan ly phong kham' },
    { value: 'ADMIN',          label: 'Quan tri vien' },
];

const ROLE_BADGE = {
    DOCTOR:            { label: 'Bac si',          cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    NURSE:             { label: 'Y ta',             cls: 'bg-teal-50 text-teal-600 border-teal-200' },
    RECEPTIONIST:      { label: 'Le tan',           cls: 'bg-purple-50 text-purple-600 border-purple-200' },
    CASHIER:           { label: 'Thu ngan',         cls: 'bg-orange-50 text-orange-600 border-orange-200' },
    CLINIC_MANAGER:    { label: 'Quan ly p. kham',  cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    ADMIN:             { label: 'Quan tri vien',    cls: 'bg-red-50 text-red-500 border-red-200' },
    GENERAL_DOCTOR:    { label: 'Bac si',           cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    SPECIALIST_DOCTOR: { label: 'Bac si',           cls: 'bg-blue-50 text-blue-600 border-blue-200' },
};

const STATUS_BADGE = {
    ACTIVE:   { label: 'Hoat dong',       cls: 'bg-green-50 text-green-600' },
    LOCKED:   { label: 'Da khoa',         cls: 'bg-red-50 text-red-500' },
    INACTIVE: { label: 'Khong hoat dong', cls: 'bg-gray-100 text-gray-500' },
};

function Avatar({ name }) {
    const initials = (name || '?').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
    const colors = ['bg-violet-100 text-violet-600','bg-sky-100 text-sky-600','bg-emerald-100 text-emerald-600','bg-amber-100 text-amber-600','bg-rose-100 text-rose-600'];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
        <div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center font-semibold text-sm shrink-0`}>
            {initials}
        </div>
    );
}

function StaffCard({ item }) {
    const systemRole  = item.systemRole || '';
    const roleBadge   = ROLE_BADGE[systemRole] || { label: systemRole, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
    const status      = item.status || 'ACTIVE';
    const statusBadge = STATUS_BADGE[status] || STATUS_BADGE.ACTIVE;
    const name     = item.fullName || '—';
    const phone    = item.phone || '—';
    const email    = item.email || '—';
    const spec     = item.specialization?.name || '';
    const username = item.username || '';

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start gap-3">
                <Avatar name={name} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    {spec && <p className="text-xs text-gray-400 mt-0.5 truncate">{spec}</p>}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadge.cls}`}>{roleBadge.label}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${statusBadge.cls}`}>{statusBadge.label}</span>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-50 pt-3 space-y-1.5">
                {phone !== '—' && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={11} className="shrink-0 text-gray-300" /><span>{phone}</span></div>}
                {email !== '—' && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={11} className="shrink-0 text-gray-300" /><span className="truncate">{email}</span></div>}
                {username && <div className="flex items-center gap-2 text-xs text-gray-400"><User size={11} className="shrink-0 text-gray-300" /><span className="font-mono truncate">{username}</span></div>}
            </div>
        </div>
    );
}

function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center gap-1">
            <button onClick={() => onChange(page - 1)} disabled={page === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i).filter(p => Math.abs(p - page) <= 2).map(p => (
                <button key={p} onClick={() => onChange(p)} className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p + 1}</button>
            ))}
            <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={14} /></button>
        </div>
    );
}

export default function ManagerStaffPage() {
    const [staff,      setStaff]      = useState([]);
    const [total,      setTotal]      = useState(0);
    const [page,       setPage]       = useState(0);
    const [loading,    setLoading]    = useState(false);
    const [search,     setSearch]     = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [sortDir,    setSortDir]    = useState('asc');

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const fetchStaff = useCallback(async (p = 0, s = search, r = roleFilter, sd = sortDir) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search: s, page: p, size: PAGE_SIZE });
            if (r) params.set('systemRole', r);
            params.set('sort', `profile.fullName,${sd}`);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/accounts/staff?${params}`, { headers: bearer() });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setStaff(Array.isArray(data.content) ? data.content : []);
            setTotal(data.totalElements ?? 0);
            setPage(p);
        } catch { }
        finally { setLoading(false); }
    }, [search, roleFilter, sortDir]);

    useEffect(() => { fetchStaff(0); }, []);

    const handleSearch = () => fetchStaff(0, search, roleFilter);
    const handleRole   = (r) => { setRoleFilter(r); fetchStaff(0, search, r); };
    const toggleSort   = () => {
        const next = sortDir === 'asc' ? 'desc' : 'asc';
        setSortDir(next);
        fetchStaff(0, search, roleFilter, next);
    };

    const doctors = staff.filter(s => ['DOCTOR','GENERAL_DOCTOR','SPECIALIST_DOCTOR'].includes(s.systemRole)).length;
    const nurses  = staff.filter(s => s.systemRole === 'NURSE').length;
    const others  = staff.length - doctors - nurses;

    return (
        <OwnerLayout>
            <div className="px-8 py-7 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">Danh sach nhan su</h1>
                        <p className="text-xs text-gray-400 mt-1">Xem thong tin toan bo nhan su. Chi Quan tri vien co the chinh sua.</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                        <Shield size={11} />
                        Che do chi xem
                    </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Tong nhan su',   value: total,   icon: User,        color: 'text-gray-700', bg: 'bg-gray-50' },
                        { label: 'Bac si',          value: doctors, icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Y ta',            value: nurses,  icon: User,        color: 'text-teal-600', bg: 'bg-teal-50' },
                        { label: 'Nhan vien khac',  value: others,  icon: User,        color: 'text-gray-500', bg: 'bg-gray-50' },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}><Icon size={14} className={color} /></div>
                            <div>
                                <p className="text-xs text-gray-400">{label}</p>
                                <p className="text-lg font-bold text-gray-900">{String(value).padStart(2, '0')}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-48">
                        <p className="text-xs text-gray-400 mb-1.5">Tim kiem</p>
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Ten, so dien thoai, email..."
                                className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-500 placeholder:text-gray-300 bg-white" />
                        </div>
                    </div>
                    <div className="w-52">
                        <p className="text-xs text-gray-400 mb-1.5">Loc theo vai tro</p>
                        <select value={roleFilter} onChange={e => handleRole(e.target.value)}
                            className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg outline-none bg-white focus:border-gray-500">
                            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSearch} className="h-9 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors">Tim kiem</button>
                </div>

                {/* Sort + count */}
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>{total > 0 ? `Hien thi ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} tren ${total} nhan su` : 'Khong co ket qua'}</span>
                    <button onClick={toggleSort} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                        Sap xep ten {sortDir === 'asc' ? 'A->Z' : 'Z->A'} <ChevronsUpDown size={12} />
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />)}
                    </div>
                ) : staff.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
                        <User size={32} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-sm text-gray-400">Khong tim thay nhan su phu hop</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {staff.map((item, idx) => <StaffCard key={item.accountId || item.staffId || idx} item={item} />)}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-end pt-2">
                        <Pagination page={page} totalPages={totalPages} onChange={(p) => fetchStaff(p)} />
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
}
