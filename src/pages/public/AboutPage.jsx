import React, { useEffect, useState } from 'react';
import InfoLayout from '@/components/layout/InfoLayout';
import { Building2, Clock, HeartPulse, Mail, MapPin, Phone, ReceiptText, Stethoscope, UserCheck } from 'lucide-react';
import { getPublicClinicInformation } from '@/services/clinicInformationService';

const AboutPage = () => {
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicClinicInformation()
      .then(data => { if (active) setClinic(data); })
      .catch(() => { /* The introduction remains available if public clinic data is unavailable. */ });
    return () => { active = false; };
  }, []);

  return (
    <InfoLayout>
      <div className="mb-10">
        <p className="text-sm font-semibold text-slate-400 mb-2">Trang chủ &gt; Về chúng tôi</p>
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Về chúng tôi</h1>
        <p className="">
          CARES được thành lập với sứ mệnh mang đến dịch vụ y tế chất lượng cao, an toàn và tận tâm cho mọi khách hàng.
        </p>
      </div>

      <div className="space-y-12">
        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
            <HeartPulse className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tận tâm chăm sóc</h3>
            <p className="text-slate-500 font-light leading-relaxed">Chúng tôi đặt sức khỏe và sự an toàn của khách hàng làm ưu tiên hàng đầu.</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
            <UserCheck className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Đội ngũ chuyên môn cao</h3>
            <p className="text-slate-500 font-light leading-relaxed">Bác sĩ giàu kinh nghiệm, tận tâm và luôn cập nhật kiến thức y khoa hiện đại.</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
            <Stethoscope className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Trang thiết bị hiện đại</h3>
            <p className="text-slate-500 font-light leading-relaxed">Hệ thống máy móc, thiết bị tiên tiến giúp chẩn đoán chính xác và điều trị hiệu quả.</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Dịch vụ chuyên nghiệp</h3>
            <p className="text-slate-500 font-light leading-relaxed">Quy trình khoa học, thủ tục đơn giản, không gian khang trang và phục vụ chu đáo.</p>
          </div>
        </div>

        {clinic && <section className="rounded-2xl border border-primary-100 bg-primary-50/40 p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Thông tin pháp lý</h2>
              <p className="mt-0.5 text-sm text-slate-500">Thông tin công khai của {clinic.clinicName}</p>
            </div>
          </div>

          <dl className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Tên pháp lý</dt>
              <dd className="mt-1 font-semibold text-slate-800">{clinic.legalName}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-slate-500"><ReceiptText size={15}/>Mã số thuế</dt>
              <dd className="mt-1 font-semibold text-slate-800">{clinic.taxCode}</dd>
            </div>
            {clinic.operatingLicense && <div>
              <dt className="text-slate-500">Giấy phép hoạt động khám bệnh, chữa bệnh</dt>
              <dd className="mt-1 font-semibold text-slate-800">{clinic.operatingLicense}</dd>
            </div>}
            <div>
              <dt className="flex items-center gap-1.5 text-slate-500"><MapPin size={15}/>Địa chỉ</dt>
              <dd className="mt-1 font-semibold text-slate-800">{clinic.address}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-slate-500"><Phone size={15}/>Hotline</dt>
              <dd className="mt-1 font-semibold text-slate-800">{clinic.phone}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-slate-500"><Mail size={15}/>Email hỗ trợ</dt>
              <dd className="mt-1 break-all font-semibold text-slate-800">{clinic.supportEmail}</dd>
            </div>
          </dl>
        </section>}
      </div>
    </InfoLayout>
  );
};

export default AboutPage;
