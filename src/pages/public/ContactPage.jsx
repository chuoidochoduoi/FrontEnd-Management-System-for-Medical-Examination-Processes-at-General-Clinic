import React, { useState } from 'react';
import InfoLayout from '@/components/layout/InfoLayout';
import { Mail, Phone, MapPin, Clock, Send, Globe2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { usePublicWorkingShifts } from '@/hooks/usePublicWorkingShifts';
import useClinicInformation from '@/hooks/useClinicInformation';

const ContactPage = () => {
  const initialForm = { fullName: '', phone: '', email: '', subject: '', message: '' };
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const workingShifts = usePublicWorkingShifts();
  const { clinicInformation } = useClinicInformation();
  const hasCoordinates = clinicInformation.latitude !== null && clinicInformation.latitude !== undefined
    && clinicInformation.longitude !== null && clinicInformation.longitude !== undefined;
  const mapQuery = hasCoordinates
    ? `${clinicInformation.latitude},${clinicInformation.longitude}`
    : clinicInformation.address;
  const socialLinks = [
    { label: 'Facebook', url: clinicInformation.facebookUrl, className: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'YouTube', url: clinicInformation.youtubeUrl, className: 'bg-red-600 hover:bg-red-700' },
    { label: 'Zalo', url: clinicInformation.zaloUrl, className: 'bg-blue-500 hover:bg-blue-600' },
  ].filter(item => item.url);

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ và tên.';
    else if (/\d/.test(form.fullName)) nextErrors.fullName = 'Họ tên không được chứa chữ số.';
    if (!/^(\+84|0)\d{9,10}$/.test(form.phone.trim())) nextErrors.phone = 'Số điện thoại Việt Nam không hợp lệ.';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Email không hợp lệ.';
    if (form.subject.trim().length < 3) nextErrors.subject = 'Chủ đề phải có ít nhất 3 ký tự.';
    if (form.message.trim().length < 10) nextErrors.message = 'Nội dung phải có ít nhất 10 ký tự.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/contact-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(), phone: form.phone.trim(),
          email: form.email.trim() || null, subject: form.subject.trim(), message: form.message.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Không thể gửi thông tin liên hệ.');
      setForm(initialForm);
      setErrors({});
      toast.success('Thông tin liên hệ đã được gửi tới CareS. Chúng tôi sẽ liên hệ lại với bạn.');
    } catch (error) {
      toast.error(error.message === 'Failed to fetch'
        ? 'Không thể kết nối đến hệ thống. Vui lòng thử lại sau.' : error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InfoLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Gửi thông tin liên hệ</h1>
        <p className="text-slate-500 font-light text-lg">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Mọi thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua các kênh bên dưới.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 xl:gap-12">
        {/* Contact Form */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Gửi thông tin liên hệ</h2>
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên</label>
              <input type="text" value={form.fullName} onChange={e => updateField('fullName', e.target.value)} maxLength={100} placeholder="Nhập họ và tên..." className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại</label>
              <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} maxLength={15} placeholder="Ví dụ: 0988123456" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ Email <span className="font-normal text-slate-400">(không bắt buộc)</span></label>
              <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} maxLength={255} placeholder="name@example.com" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề</label>
              <input type="text" value={form.subject} onChange={e => updateField('subject', e.target.value)} maxLength={150} placeholder="Nhập tiêu đề..." className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nội dung liên hệ</label>
              <textarea rows="4" value={form.message} onChange={e => updateField('message', e.target.value)} maxLength={1000} placeholder="Nhập nội dung tin nhắn của bạn..." className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
              {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-primary-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Đang gửi...' : 'Gửi thông tin'} <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Contact Info & Map */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin liên lạc</h2>
            <ul className="space-y-6">
              <li className="flex gap-4 items-start">
                <span className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary-600" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Email hỗ trợ</p>
                  <p className="font-medium text-slate-900">{clinicInformation.supportEmail}</p>
                </div>
              </li>
              {clinicInformation.websiteUrl && <li className="flex gap-4 items-start">
                <span className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                  <Globe2 className="w-5 h-5 text-primary-600" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Website</p>
                  <a href={clinicInformation.websiteUrl} target="_blank" rel="noreferrer" className="font-medium text-primary-700 hover:underline">{clinicInformation.websiteUrl}</a>
                </div>
              </li>}
              <li className="flex gap-4 items-start">
                <span className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary-600" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Số điện thoại</p>
                  <p className="font-medium text-slate-900">{clinicInformation.phone}</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Địa chỉ phòng khám</p>
                  <p className="font-medium text-slate-900">{clinicInformation.address}</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <span className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary-600" />
                </span>
                <div>
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">Thời gian làm việc</p>
                  <p className="font-medium text-slate-900 mb-1">{clinicInformation.workingDays}</p>
                  {workingShifts.map(shift => <p key={shift.label} className="text-sm text-slate-600">{shift.label}: {shift.time}</p>)}
                  <p className="text-sm text-slate-600">{clinicInformation.closedDays}</p>
                </div>
              </li>
            </ul>
          </div>

          {socialLinks.length > 0 && <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Kết nối với chúng tôi</h2>
            <div className="flex gap-3">
              {socialLinks.map(item => <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className={`flex-1 py-3 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${item.className}`}>{item.label}</a>)}
            </div>
          </div>}

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Vị trí phòng khám</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              <iframe
                title={`Bản đồ vị trí ${clinicInformation.clinicName}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                className="h-72 w-full border-0 xl:h-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </InfoLayout>
  );
};

export default ContactPage;
