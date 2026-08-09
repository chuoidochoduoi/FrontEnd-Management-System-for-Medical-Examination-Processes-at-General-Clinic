// src/pages/receptionist/RecordsManagementPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import ReceptionistLayout from '@/components/layout/ReceptionistLayout';
import { useRecordsManagement } from '@/hooks/useRecordsManagement';
import { ROUTES } from '@/constants/routes';

/* ── Blood type badge ── */
const BT_COLOR = {
    'O+': 'text-red-500',  'O-': 'text-red-400',
    'A+': 'text-blue-500', 'A-': 'text-blue-400',
    'B+': 'text-green-500','B-': 'text-green-400',
    'AB+':'text-purple-500','AB-':'text-purple-400',
};

function BloodTypeBadge({ value }) {
    if (!value) return <span className="text-gray-300 text-sm">—</span>;
    return (
        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
            <span className={`text-sm font-bold ${BT_COLOR[value] ?? 'text-gray-600'}`}>{value}</span>
        </div>
    );
}

/* ── Pagination ── */
function Pagination({ page, total, pageSize, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;
    const pages = totalPages <= 5
        ? Array.from({ length: totalPages }, (_, i) => i + 1)
        : page <= 3 ? [1, 2, 3, '...', totalPages]
            : page >= totalPages - 2 ? [1, '...', totalPages - 2, totalPages - 1, totalPages]
                : [1, '...', page - 1, page, page + 1, '...', totalPages];

    return (
        <div className="flex justify-end items-center gap-1 mt-4">
            <button onClick={() => onChange(page - 1)} disabled={page === 1}
                    className="w-8 h-8 text-sm flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors">
                ‹
            </button>
            {pages.map((p, i) =>
                p === '...'
                    ? <span key={i} className="w-8 text-center text-xs text-gray-300">…</span>
                    : <button key={p} onClick={() => onChange(p)}
                              className={`w-8 h-8 text-sm rounded border transition-colors ${
                                  p === page ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                              }`}>{p}</button>
            )}
            <button onClick={() => onChange(page + 1)} disabled={page === Math.ceil(total / pageSize)}
                    className="w-8 h-8 text-sm flex items-center justify-center border border-gray-200 rounded text-gray-400 disabled:opacity-30 hover:border-gray-400 transition-colors">
                ›
            </button>
        </div>
    );
}

const GENDERS    = ['All', 'Nam', 'Nữ'];
const AGE_RANGES = ['All', '0-18', '19-40', '41-60', '60+'];
const BLOOD_TYPES = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const selectCls = 'h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 bg-white w-full';

export default function RecordsManagementPage() {
    const { t }    = useTranslation('receptionist');
    const navigate = useNavigate();
    const { records, loading, error, total, page, PAGE_SIZE, fetchRecords } = useRecordsManagement();

    const [search,    setSearch]    = useState('');
    const [gender,    setGender]    = useState('');
    const [age,       setAge]       = useState('');
    const [bloodType, setBloodType] = useState('');

    useEffect(() => { fetchRecords(); }, []);

    const handleFilter = () => fetchRecords({ search, gender, age, bloodType, page: 1 });
    const handlePage   = (p) => fetchRecords({ search, gender, age, bloodType, page: p });

    const from = (page - 1) * PAGE_SIZE + 1;
    const to   = Math.min(page * PAGE_SIZE, total);

    return (
        <ReceptionistLayout>
            <div className="space-y-5">
                <div><h1 className="text-lg font-semibold text-gray-900">Danh sách bệnh nhân</h1><p className="mt-1 text-sm text-gray-400">Thông tin cá nhân cơ bản của bệnh nhân tại phòng khám.</p></div>

                {/* Filter bar */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 grid grid-cols-[1fr_140px_160px_160px_auto] gap-3 items-end">
                    {/* Search */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">Từ khóa tìm kiếm</p>
                        <div className="relative">
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFilter()}
                                placeholder="Nhập tên bệnh nhân hoặc số điện thoại..."
                                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {/* Giới tính */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">Giới tính</p>
                        <select value={gender} onChange={e => setGender(e.target.value === 'All' ? '' : e.target.value)} className={selectCls}>
                            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    {/* Độ tuổi */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">Độ tuổi</p>
                        <select value={age} onChange={e => setAge(e.target.value === 'All' ? '' : e.target.value)} className={selectCls}>
                            {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>

                    {/* Nhóm máu */}
                    <div>
                        <p className="text-xs text-gray-400 mb-1.5">Nhóm máu</p>
                        <select value={bloodType} onChange={e => setBloodType(e.target.value === 'All' ? '' : e.target.value)} className={selectCls}>
                            {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {/* Filter button */}
                    <button
                        onClick={handleFilter}
                        className="h-10 px-5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Search size={13} /> Lọc
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[150px_1fr_160px_150px_170px] px-5 py-3 border-b border-gray-100 bg-gray-50">
                        {['Mã bệnh nhân','Họ và tên','Số điện thoại','Ngày sinh / Giới tính','Thao tác'].map(col => (
                            <span key={col} className="text-xs font-medium text-gray-400">{col}</span>
                        ))}
                    </div>

                    {/* States */}
                    {loading && <p className="text-sm text-gray-400 text-center py-12">Đang tải...</p>}
                    {error   && <p className="text-sm text-red-500 text-center py-12">{error}</p>}
                    {!loading && !error && records.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-12">Không có hồ sơ nào.</p>
                    )}

                    {/* Rows */}
                    {!loading && records.map(rec => (
                        <div
                            key={rec.id}
                            className="grid grid-cols-[150px_1fr_160px_150px_170px] px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors items-center"
                        >
                            {/* Mã bệnh án */}
                            <span className="text-sm font-bold text-gray-900">{rec.code || '—'}</span>

                            <div>
                                <p className="text-sm font-semibold text-gray-900">{rec.fullName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{rec.email || '-'}</p>
                            </div>
                            <span className="text-sm text-gray-700">{rec.phone || '-'}</span>
                            <div><p className="text-sm text-gray-700">{rec.dateOfBirth ? new Date(rec.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</p><p className="mt-0.5 text-xs text-gray-400">{rec.gender === 'MALE' ? 'Nam' : rec.gender === 'FEMALE' ? 'Nữ' : '-'}</p></div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1.5 items-start">
                                <button
                                    onClick={() => navigate(ROUTES.RECEPTIONIST_PATIENT_DETAIL.replace(':id', rec.id))}
                                    className="text-xs text-gray-500 hover:text-primary-500 transition-colors font-medium"
                                >
                                    Xem chi tiết
                                </button>
                                <button
                                    onClick={() => navigate(`${ROUTES.RECEPTIONIST_CREATE_TICKET}?phone=${rec.phone}`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
                                >
                                    📋 Tạo phiếu khám
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Hiển thị {from}–{to} trên tổng số {total} hồ sơ
                        </p>
                        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={handlePage} />
                    </div>
                )}
            </div>
        </ReceptionistLayout>
    );
}
