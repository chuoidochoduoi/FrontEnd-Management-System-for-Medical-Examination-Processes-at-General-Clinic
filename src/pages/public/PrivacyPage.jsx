import React from 'react';
import InfoLayout from '@/components/layout/InfoLayout';

const PrivacyPage = () => {
  return (
    <InfoLayout>
      <div className="mb-10">
        <p className="text-sm font-semibold text-slate-400 mb-2">Trang chủ &gt; Chính sách bảo mật</p>
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Chính sách bảo mật</h1>
        <p className="text-slate-600 font-light text-lg leading-relaxed max-w-3xl">
          CARES cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn khi sử dụng website và dịch vụ của chúng tôi.
        </p>
      </div>

      <div className="space-y-10 text-slate-600 font-light leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. Thu thập thông tin</h2>
          <p>
            Chúng tôi thu thập các thông tin cá nhân cần thiết như họ tên, số điện thoại, email, thông tin sức khỏe... để phục vụ cho việc đặt lịch, khám chữa bệnh và chăm sóc khách hàng.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. Mục đích sử dụng thông tin</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Cung cấp, duy trì và cải thiện dịch vụ.</li>
            <li>Liên hệ xác nhận lịch hẹn, hỗ trợ và chăm sóc khách hàng.</li>
            <li>Thông báo các chương trình ưu đãi, dịch vụ mới (nếu bạn đồng ý nhận thông tin).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. Bảo mật thông tin</h2>
          <p>
            Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ thông tin cá nhân của bạn khỏi truy cập, sử dụng hoặc tiết lộ trái phép.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Chia sẻ thông tin</h2>
          <p>
            CARES không chia sẻ thông tin cá nhân của bạn cho bên thứ ba, ngoại trừ khi có yêu cầu của pháp luật hoặc được sự đồng ý của bạn.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. Quyền của bạn</h2>
          <p>
            Bạn có quyền truy cập, cập nhật, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình bằng cách liên hệ với chúng tôi qua các kênh hỗ trợ.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default PrivacyPage;
