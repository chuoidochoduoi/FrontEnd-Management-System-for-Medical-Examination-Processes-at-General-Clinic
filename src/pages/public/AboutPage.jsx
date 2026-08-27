import React from 'react';
import InfoLayout from '@/components/layout/InfoLayout';
import { HeartPulse, UserCheck, Stethoscope, Clock } from 'lucide-react';

const AboutPage = () => {
  return (
    <InfoLayout>
      <div className="mb-10">
        <p className="text-sm font-semibold text-slate-400 mb-2">Trang chủ &gt; Về chúng tôi</p>
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Về chúng tôi</h1>
        <p className="text-slate-600 font-light text-lg leading-relaxed max-w-3xl">
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
      </div>
    </InfoLayout>
  );
};

export default AboutPage;
