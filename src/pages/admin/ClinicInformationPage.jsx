import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock3, ExternalLink, Link2, MapPin, RotateCcw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/layout/AdminLayout';
import { ROUTES } from '@/constants/routes';
import { CLINIC_INFO } from '@/constants/clinicInfo';
import { usePublicWorkingShifts } from '@/hooks/usePublicWorkingShifts';
import { getClinicInformation, updateClinicInformation } from '@/services/clinicInformationService';

const EMPTY_ERRORS = {};
const optionalUrlFields = ['websiteUrl', 'facebookUrl', 'youtubeUrl', 'zaloUrl'];
const requiredFields = ['clinicName', 'legalName', 'taxCode', 'supportEmail', 'phone', 'address'];

const toForm = data => ({
  ...CLINIC_INFO,
  ...data,
  latitude: data?.latitude ?? '',
  longitude: data?.longitude ?? '',
});

const inputClass = error => `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
  error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-primary-500 focus:ring-primary-100'
}`;

function Field({ label, name, value, onChange, error, required, placeholder, type = 'text' }) {
  return <label className="block min-w-0 text-sm font-medium text-slate-700">
    {label}{required && <span className="ml-1 text-red-500">*</span>}
    <input name={name} value={value ?? ''} onChange={onChange} type={type} placeholder={placeholder} className={inputClass(error)} />
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>;
}

function Card({ title, icon: Icon, children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-5 flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Icon size={18}/></span>
      <h2 className="font-bold text-slate-900">{title}</h2>
    </div>
    {children}
  </section>;
}

export default function ClinicInformationPage() {
  const navigate = useNavigate();
  const workingShifts = usePublicWorkingShifts();
  const [form, setForm] = useState(toForm(CLINIC_INFO));
  const [initial, setInitial] = useState(toForm(CLINIC_INFO));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  const mapQuery = useMemo(() => {
    const hasCoordinates = form.latitude !== '' && form.longitude !== '';
    return hasCoordinates ? `${form.latitude},${form.longitude}` : form.address;
  }, [form.address, form.latitude, form.longitude]);
  const encodedMapQuery = encodeURIComponent(mapQuery || CLINIC_INFO.address);
  const embedUrl = `https://www.google.com/maps?q=${encodedMapQuery}&output=embed`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;

  const load = async () => {
    setLoading(true);
    try {
      const data = toForm(await getClinicInformation());
      setForm(data);
      setInitial(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const change = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    requiredFields.forEach(name => {
      if (!String(form[name] ?? '').trim()) next[name] = 'Trường này không được để trống.';
    });
    if (form.taxCode && !/^\d{10}(?:-\d{3})?$/.test(form.taxCode.trim())) next.taxCode = 'Mã số thuế phải gồm 10 số hoặc có dạng 10 số-3 số.';
    if (form.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail.trim())) next.supportEmail = 'Email hỗ trợ không đúng định dạng.';
    if (form.phone && !/^[+0-9][0-9 .()-]{7,29}$/.test(form.phone.trim())) next.phone = 'Số điện thoại không đúng định dạng.';
    optionalUrlFields.forEach(name => {
      if (form[name] && !/^https?:\/\/.+/.test(form[name].trim())) next[name] = 'Liên kết phải bắt đầu bằng http:// hoặc https://.';
    });
    if (form.latitude !== '' && (Number.isNaN(Number(form.latitude)) || Number(form.latitude) < -90 || Number(form.latitude) > 90)) next.latitude = 'Vĩ độ phải từ -90 đến 90.';
    if (form.longitude !== '' && (Number.isNaN(Number(form.longitude)) || Number(form.longitude) < -180 || Number(form.longitude) > 180)) next.longitude = 'Kinh độ phải từ -180 đến 180.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async event => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
      };
      const saved = toForm(await updateClinicInformation(payload));
      setForm(saved);
      setInitial(saved);
      setErrors(EMPTY_ERRORS);
      toast.success('Đã cập nhật thông tin phòng khám.');
    } catch (error) {
      setErrors(error.fields || EMPTY_ERRORS);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><p className="py-24 text-center text-sm text-slate-500">Đang tải thông tin phòng khám...</p></AdminLayout>;

  return <AdminLayout>
    <form onSubmit={submit} className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thông tin phòng khám</h1>
          <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin pháp lý, liên hệ và vị trí công khai của phòng khám.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => { setForm(initial); setErrors(EMPTY_ERRORS); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw size={16}/>Khôi phục</button>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"><Save size={16}/>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,1.08fr)]">
        <div className="space-y-5">
          <Card title="Thông tin pháp lý" icon={Building2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên hiển thị" name="clinicName" value={form.clinicName} onChange={change} error={errors.clinicName} required/>
              <Field label="Tên pháp lý" name="legalName" value={form.legalName} onChange={change} error={errors.legalName} required/>
              <Field label="Mã số thuế" name="taxCode" value={form.taxCode} onChange={change} error={errors.taxCode} required/>
              <Field label="Số giấy phép hoạt động" name="operatingLicense" value={form.operatingLicense} onChange={change} error={errors.operatingLicense}/>
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Giới thiệu ngắn
                <textarea name="shortDescription" value={form.shortDescription ?? ''} onChange={change} maxLength={500} rows={4} className={inputClass(errors.shortDescription)} />
                <span className="mt-1 flex justify-between text-xs"><span className="text-red-600">{errors.shortDescription}</span><span className="text-slate-400">{form.shortDescription?.length || 0}/500</span></span>
              </label>
            </div>
          </Card>

          <Card title="Thông tin liên hệ" icon={Link2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Số điện thoại" name="phone" value={form.phone} onChange={change} error={errors.phone} required/>
              <Field label="Email hỗ trợ" name="supportEmail" value={form.supportEmail} onChange={change} error={errors.supportEmail} required type="email"/>
              <Field label="Website" name="websiteUrl" value={form.websiteUrl} onChange={change} error={errors.websiteUrl} placeholder="https://..."/>
              <div className="sm:col-span-2"><Field label="Địa chỉ phòng khám" name="address" value={form.address} onChange={change} error={errors.address} required/></div>
            </div>
          </Card>

          <Card title="Mạng xã hội" icon={Link2}>
            <div className="space-y-4">
              <Field label="Facebook" name="facebookUrl" value={form.facebookUrl} onChange={change} error={errors.facebookUrl} placeholder="https://facebook.com/..."/>
              <Field label="YouTube" name="youtubeUrl" value={form.youtubeUrl} onChange={change} error={errors.youtubeUrl} placeholder="https://youtube.com/..."/>
              <Field label="Zalo" name="zaloUrl" value={form.zaloUrl} onChange={change} error={errors.zaloUrl} placeholder="https://zalo.me/..."/>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Vị trí bản đồ" icon={MapPin}>
            <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="Vĩ độ" name="latitude" value={form.latitude} onChange={change} error={errors.latitude} placeholder="21.0128000"/>
              <Field label="Kinh độ" name="longitude" value={form.longitude} onChange={change} error={errors.longitude} placeholder="105.5259000"/>
              <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-primary-500 px-4 text-sm font-semibold text-primary-600 hover:bg-primary-50"><ExternalLink size={16}/>Mở bản đồ</a>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <iframe title="Bản đồ vị trí phòng khám" src={embedUrl} className="h-[390px] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
            </div>
          </Card>

          <Card title="Thời gian làm việc" icon={Clock3}>
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span>Thứ 2 - Thứ 7 · Chủ nhật nghỉ</span>
              <span className="rounded-full bg-primary-50 px-2.5 py-1 font-semibold text-primary-700">Đồng bộ từ cấu hình ca</span>
            </div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {workingShifts.map(shift => <div key={shift.label} className="flex items-center justify-between px-4 py-3 text-sm"><span className="font-medium text-slate-700">{shift.label}</span><span className="rounded-md bg-slate-50 px-3 py-1.5 font-mono text-slate-700">{shift.time}</span></div>)}
            </div>
            <button type="button" onClick={() => navigate(ROUTES.ADMIN_SHIFTS)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50"><Clock3 size={16}/>Đi đến cấu hình ca</button>
          </Card>
        </div>
      </div>
    </form>
  </AdminLayout>;
}
