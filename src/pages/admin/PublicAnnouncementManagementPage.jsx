import { useEffect, useState } from 'react';
import { BellRing, Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  createAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  setAnnouncementPublication,
  updateAnnouncement,
} from '@/services/publicAnnouncementService';

const emptyForm = { title: '', content: '', startsAt: '', endsAt: '', published: true };
const toInputDateTime = value => value ? value.slice(0, 16) : '';
const formatDateTime = value => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : 'Không giới hạn';

export default function PublicAnnouncementManagementPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await getAllAnnouncements()); }
    catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = item => {
    setEditing(item);
    setForm({
      title: item.title,
      content: item.content,
      startsAt: toInputDateTime(item.startsAt),
      endsAt: toInputDateTime(item.endsAt),
      published: item.published,
    });
    setShowForm(true);
  };

  const submit = async event => {
    event.preventDefault();
    if (form.endsAt && form.startsAt && form.endsAt <= form.startsAt) {
      toast.warning('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };
    try {
      if (editing) await updateAnnouncement(editing.announcementId, payload);
      else await createAnnouncement(payload);
      toast.success(editing ? 'Đã cập nhật thông báo.' : 'Đã tạo thông báo.');
      setShowForm(false);
      await load();
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  };

  const togglePublication = async item => {
    try {
      await setAnnouncementPublication(item.announcementId, !item.published);
      toast.success(item.published ? 'Đã ẩn thông báo.' : 'Đã xuất bản thông báo.');
      await load();
    } catch (error) { toast.error(error.message); }
  };

  const remove = async item => {
    if (!window.confirm(`Xóa thông báo “${item.title}”?`)) return;
    try {
      await deleteAnnouncement(item.announcementId);
      toast.success('Đã xóa thông báo.');
      await load();
    } catch (error) { toast.error(error.message); }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Thông báo công khai</h1>
            <p className="mt-1 text-sm text-slate-500">Tạo và quản lý thông báo hiển thị trên Landing Page.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700">
            <Plus size={18} /> Tạo thông báo
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{editing ? 'Chỉnh sửa thông báo' : 'Thông báo mới'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                Tiêu đề *
                <input required maxLength={150} value={form.title} onChange={e => setForm(v => ({ ...v, title: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-primary-500" placeholder="Ví dụ: Điều chỉnh giờ làm việc" />
              </label>
              <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                Nội dung *
                <textarea required maxLength={3000} rows={5} value={form.content} onChange={e => setForm(v => ({ ...v, content: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 p-4 font-normal outline-none focus:border-primary-500" placeholder="Nội dung khách hàng sẽ nhìn thấy trên trang chủ..." />
              </label>
              <label className="text-sm font-semibold text-slate-700">Bắt đầu hiển thị
                <input type="datetime-local" value={form.startsAt} onChange={e => setForm(v => ({ ...v, startsAt: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 font-normal" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Kết thúc hiển thị
                <input type="datetime-local" value={form.endsAt} min={form.startsAt || undefined} onChange={e => setForm(v => ({ ...v, endsAt: e.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 font-normal" />
              </label>
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.published} onChange={e => setForm(v => ({ ...v, published: e.target.checked }))} className="h-4 w-4 accent-primary-600" />
              Xuất bản ngay sau khi lưu
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Hủy</button>
              <button disabled={saving} className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thông báo'}</button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? <p className="p-8 text-center text-sm text-slate-400">Đang tải thông báo...</p>
            : items.length === 0 ? (
              <div className="p-12 text-center"><BellRing className="mx-auto mb-3 text-slate-300" size={36} /><p className="font-semibold text-slate-700">Chưa có thông báo công khai</p></div>
            ) : items.map(item => (
              <article key={item.announcementId} className="border-b border-slate-100 p-5 last:border-0">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.currentlyVisible ? 'bg-emerald-50 text-emerald-700' : item.published ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.currentlyVisible ? 'Đang hiển thị' : item.published ? 'Đã lên lịch' : 'Bản nháp'}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.content}</p>
                    <p className="mt-3 text-xs text-slate-400">Từ {formatDateTime(item.startsAt)} · Đến {formatDateTime(item.endsAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => togglePublication(item)} title={item.published ? 'Ẩn' : 'Xuất bản'} className="rounded-lg border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50">{item.published ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                    <button onClick={() => openEdit(item)} title="Chỉnh sửa" className="rounded-lg border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><Pencil size={17} /></button>
                    <button onClick={() => remove(item)} title="Xóa" className="rounded-lg border border-red-100 p-2.5 text-red-500 hover:bg-red-50"><Trash2 size={17} /></button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>
    </AdminLayout>
  );
}
