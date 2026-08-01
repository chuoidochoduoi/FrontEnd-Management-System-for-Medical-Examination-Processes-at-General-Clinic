import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointment } from '@/hooks/useAppointment';
import { 
  ArrowRight,
  Stethoscope,
  Microscope,
  Activity,
  Pill,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  Menu,
  X,
  PhoneCall,
  MapPin,
  UserCircle
} from 'lucide-react';

const get = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { services: apiServices, loadingServices } = useAppointment();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const services = [
    { icon: Stethoscope, title: "Khám Bệnh Đa Khoa", desc: "Đội ngũ bác sĩ tận tâm với nhiều năm kinh nghiệm, khám tổng quát và tư vấn phác đồ điều trị hiệu quả." },
    { icon: Microscope, title: "Xét Nghiệm Công Nghệ Cao", desc: "Trang bị hệ thống xét nghiệm tự động, đạt chuẩn quốc tế, mang lại kết quả nhanh chóng và chuẩn xác tuyệt đối." },
    { icon: Activity, title: "Chẩn Đoán Hình Ảnh", desc: "Hệ thống X-Quang, siêu âm kỹ thuật số thế hệ mới giúp tầm soát và phát hiện sớm các bệnh lý." },
    { icon: Pill, title: "Dược Phẩm Chuẩn Quốc Tế", desc: "Nhà thuốc đạt chuẩn GPP, cung cấp dược phẩm nguồn gốc rõ ràng với sự tư vấn chuyên sâu." }
  ];

  const features = [
    { icon: Clock, title: "Tối Ưu Thời Gian", desc: "Hệ thống xếp hàng thông minh loại bỏ hoàn toàn thời gian chờ đợi vô ích." },
    { icon: ShieldCheck, title: "Bảo Mật Tối Đa", desc: "Hồ sơ y tế điện tử được mã hóa và bảo mật theo tiêu chuẩn quốc tế cao nhất." },
    { icon: Award, title: "Dịch Vụ Đẳng Cấp", desc: "Trải nghiệm không gian y tế tiện nghi, sạch sẽ và chuyên nghiệp." }
  ];

  const featuredDoctors = [
    {
      name: "TS.BS. Nguyễn Trí Dũng",
      specialty: "Khám Bệnh Đa Khoa",
      desc: "Hơn 20 năm kinh nghiệm trong khám chữa bệnh tổng quát. Luôn tận tâm và theo dõi sát sao tình trạng sức khỏe của bệnh nhân.",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop"
    },
    {
      name: "ThS.BS. Trần Thu Hà",
      specialty: "Chuyên Gia Sinh Hóa - Xét Nghiệm",
      desc: "Nhiều năm kinh nghiệm trong quản lý và vận hành hệ thống xét nghiệm công nghệ cao, đảm bảo kết quả chính xác.",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop"
    },
    {
      name: "BS.CKI. Phạm Văn Minh",
      specialty: "Chẩn Đoán Hình Ảnh",
      desc: "Chuyên gia về siêu âm và X-quang kỹ thuật số. Thường xuyên tu nghiệp cập nhật kiến thức chẩn đoán hình ảnh tiên tiến.",
      image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=800&auto=format&fit=crop"
    },
    {
      name: "BS. Lê Hoàng Yến",
      specialty: "Khám Nội Tổng Hợp",
      desc: "Bác sĩ tận tâm với kinh nghiệm dày dặn trong chẩn đoán và điều trị các bệnh lý nội khoa mãn tính.",
      image: "https://images.unsplash.com/photo-1594824432258-0050b1a0d314?q=80&w=800&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-jakarta text-slate-800 selection:bg-slate-900 selection:text-white">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/50 py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="w-full px-8 lg:px-16 xl:px-20">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-none">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-900 tracking-widest uppercase leading-none">Kinh Bắc</span>
                <span className="text-[10px] text-slate-500 tracking-[0.3em] uppercase mt-1">Medical Center</span>
              </div>
            </div>

            {/* Desktop Nav Links - Centered */}
            <div className="hidden md:flex items-center gap-6 xl:gap-8">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Trang chủ</button>
              <a href="#about" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Giới thiệu</a>
              <button onClick={() => navigate('/appointment')} className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Đặt lịch khám</button>
              <a href="#process" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Quy trình</a>
              <a href="#doctors" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Bác sĩ</a>
              <a href="#pricing" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Bảng giá</a>
              <a href="#contact" className="text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">Liên hệ</a>
            </div>

            {/* Desktop Action Buttons - Right */}
            <div className="hidden md:flex items-center gap-6">
              {get('token') ? (
                <button 
                  onClick={() => navigate('/customer/profile')}
                  className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 hover:text-primary-600 transition-colors"
                >
                  <UserCircle className="w-5 h-5" />
                  {get('username') || 'Hồ sơ'}
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-900 hover:text-primary-600 transition-colors"
                >
                  Đăng Nhập
                </button>
              )}
              <button 
                onClick={() => navigate('/appointment')}
                className="bg-slate-900 text-white text-xs font-semibold tracking-[0.1em] uppercase px-7 py-3.5 hover:bg-slate-800 transition-all duration-300"
              >
                Đặt Lịch Ngay
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div className={`fixed inset-0 z-40 bg-white transition-transform duration-500 ease-in-out transform ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'} flex flex-col items-center justify-center gap-6 md:hidden`}>
        <button onClick={() => { setMobileMenuOpen(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">Trang chủ</button>
        <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">Giới thiệu</a>
        <button onClick={() => { setMobileMenuOpen(false); navigate('/appointment'); }} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">Đặt lịch khám</button>
        <a href="#process" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">Quy trình khám bệnh</a>
        <a href="#doctors" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">Danh sách bác sĩ</a>
        <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">Bảng giá dịch vụ</a>
        <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-900">Liên hệ</a>
        {get('token') ? (
          <button onClick={() => navigate('/customer/profile')} className="flex items-center gap-2 text-lg font-semibold tracking-[0.1em] uppercase text-slate-900 mt-4">
            <UserCircle className="w-6 h-6" />
            {get('username') || 'Hồ sơ'}
          </button>
        ) : (
          <button onClick={() => navigate('/login')} className="text-lg font-semibold tracking-[0.1em] uppercase text-slate-500 mt-4">Đăng Nhập</button>
        )}
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white">
        {/* Subtle abstract background element */}
        <div className="absolute top-0 right-0 w-[50vw] h-full bg-slate-50 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-50/30 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl relative z-10 pt-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[1px] bg-primary-600"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-600">Hệ Thống Y Tế Chuẩn Mực</span>
              </div>
              <h1 className="text-5xl lg:text-[4rem] font-light text-slate-900 leading-[1.1] mb-8">
                Kiến Tạo <br />
                <span className="font-bold">Đẳng Cấp Mới</span> <br />
                Trong Chăm Sóc Sức Khỏe
              </h1>
              <p className="text-lg text-slate-500 font-light leading-relaxed mb-12 max-w-lg">
                Sự giao thoa hoàn hảo giữa y học tinh hoa và công nghệ quản lý hiện đại. Tận hưởng dịch vụ y tế chuẩn quốc tế, không thời gian chờ đợi, dành riêng cho bạn.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => navigate('/appointment')}
                  className="group relative overflow-hidden bg-slate-900 text-white px-10 py-5 text-sm font-semibold tracking-[0.1em] uppercase transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Đăng Ký Khám
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-primary-600 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out z-0"></div>
                </button>
                <button 
                  onClick={() => document.getElementById('process').scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center justify-center gap-3 px-10 py-5 text-sm font-semibold tracking-[0.1em] uppercase text-slate-900 border border-slate-200 hover:border-slate-900 transition-all duration-300"
                >
                  Khám Phá
                </button>
              </div>
            </div>

            <div className="relative lg:h-[80vh] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-white transform -skew-x-6 z-0"></div>
              <div className="relative z-10 w-full h-[600px] overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=1200&auto=format&fit=crop" 
                  alt="Premium Healthcare" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  style={{ filter: 'contrast(1.05) brightness(1.05)' }}
                />
                {/* Elegant overlay card */}
                <div className="absolute bottom-10 -left-10 md:left-10 bg-white/95 backdrop-blur-md p-8 shadow-2xl border-l-4 border-primary-600 max-w-sm transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out">
                  <p className="text-xs font-semibold tracking-[0.1em] uppercase text-slate-400 mb-2">Đặc Quyền Của Bạn</p>
                  <p className="text-lg font-bold text-slate-900 leading-snug">Hệ thống luân chuyển thông minh, tối ưu 100% thời gian lưu trú.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900 text-white relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 divide-x divide-slate-800/50 text-center">
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">15<span className="text-3xl">+</span></p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">Năm Kinh Nghiệm</p>
            </div>
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">50<span className="text-3xl">+</span></p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">Chuyên Gia Y Tế</p>
            </div>
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">98<span className="text-3xl">%</span></p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">Tỷ Lệ Hài Lòng</p>
            </div>
            <div>
              <p className="text-5xl font-light text-primary-400 mb-4">4.0</p>
              <p className="text-xs tracking-[0.2em] uppercase text-slate-400">Công Nghệ Quản Lý</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-[1px] bg-slate-900"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">Danh Mục Dịch Vụ</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-900 leading-tight">
                Dịch Vụ Y Tế <br /> <span className="font-bold">Tinh Hoa</span>
              </h2>
            </div>
            <p className="text-slate-500 font-light max-w-md">
              Mỗi dịch vụ tại Kinh Bắc đều được đầu tư bài bản về nhân lực và hệ thống công nghệ xét nghiệm, mang đến sự an tâm tuyệt đối cho khách hàng.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
            {services.map((service, index) => (
              <div key={index} className="group relative">
                <div className="flex gap-8 items-start">
                  <div className="w-16 h-16 shrink-0 border border-slate-200 flex items-center justify-center bg-white group-hover:bg-slate-900 group-hover:border-slate-900 transition-colors duration-500">
                    <service.icon className="w-6 h-6 text-slate-900 group-hover:text-white transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors duration-500">{service.title}</h3>
                    <p className="text-slate-500 font-light leading-relaxed mb-6">{service.desc}</p>
                    <div className="w-12 h-[1px] bg-slate-300 group-hover:w-full group-hover:bg-primary-600 transition-all duration-700 ease-out"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Tech Section */}
      <section id="about" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative group">
                 <img 
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop" 
                  alt="Modern Hospital Interior" 
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" 
                 />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-slate-900 text-white p-12 max-w-xs shadow-2xl z-10 hidden md:block">
                <h4 className="text-3xl font-light mb-4 text-primary-400">Tiên Phong</h4>
                <p className="text-sm font-light leading-relaxed text-slate-300 text-justify">
                  Ứng dụng hệ thống Medical Examination Management System thế hệ mới, tái định nghĩa hoàn toàn trải nghiệm khám chữa bệnh tại Việt Nam.
                </p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-[1px] bg-slate-900"></div>
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">Sự Khác Biệt</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-900 leading-tight mb-10">
                Sự Tinh Tế Trong <br /> <span className="font-bold">Từng Trải Nghiệm</span>
              </h2>
              <p className="text-slate-500 font-light text-lg mb-12 leading-relaxed">
                Chúng tôi hiểu rằng thời gian và sự thoải mái của bạn là vô giá. Tại Kinh Bắc, sự lộn xộn và chờ đợi mệt mỏi được thay thế bằng quy trình số hóa toàn diện, chuyên nghiệp và tĩnh lặng.
              </p>

              <div className="space-y-10">
                {features.map((item, index) => (
                  <div key={index} className="flex gap-6 items-start group cursor-default">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-primary-600 transition-colors duration-500"></div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-slate-500 font-light leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Elegant Steps */}
      <section id="process" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-8 h-[1px] bg-slate-900"></div>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">Quy Trình Chuẩn Mực</span>
            <div className="w-8 h-[1px] bg-slate-900"></div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-20">
            Hành Trình <span className="font-bold">Đặc Quyền</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-slate-200"></div>
            
            {[
              { num: "01", title: "Đặt Hẹn Ưu Tiên", desc: "Xác nhận lịch trực tuyến nhanh chóng." },
              { num: "02", title: "Khám Lâm Sàng", desc: "Phục vụ ngay lập tức đúng khung giờ." },
              { num: "03", title: "Chỉ Định Xét Nghiệm", desc: "Điều hướng tự động, bảo mật tối đa." },
              { num: "04", title: "Nhận Kết Quả", desc: "Tư vấn chuyên sâu 1-1 cùng chuyên gia." },
            ].map((item, index) => (
              <div key={index} className="relative text-center group cursor-default">
                <div className="w-24 h-24 mx-auto bg-white rounded-none border border-slate-200 flex items-center justify-center mb-8 relative z-10 group-hover:border-slate-900 group-hover:bg-slate-900 transition-colors duration-500">
                  <span className="text-2xl font-light text-slate-400 group-hover:text-white transition-colors duration-500">{item.num}</span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
                <p className="text-slate-500 font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="w-8 h-[1px] bg-slate-900"></div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">Danh Sách Bác Sĩ</span>
              <div className="w-8 h-[1px] bg-slate-900"></div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6">Đội Ngũ Chuyên Gia <span className="font-bold">Hàng Đầu</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Tự hào quy tụ đội ngũ y bác sĩ đầu ngành, tận tâm và giàu y đức. Luôn đặt sức khỏe và sự an toàn của bệnh nhân lên hàng đầu.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredDoctors.map((doc, idx) => (
              <div key={idx} className="group relative bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500">
                <div className="aspect-[3/4] overflow-hidden relative bg-slate-50">
                  <img 
                    src={doc.image} 
                    alt={doc.name} 
                    className="w-full h-full object-cover object-top filter grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 text-white">
                    <p className="text-sm font-light leading-relaxed line-clamp-3">{doc.desc}</p>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">{doc.name}</h3>
                  <p className="text-xs font-semibold tracking-widest uppercase text-primary-500">{doc.specialty}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
             <button className="text-sm font-bold tracking-widest uppercase text-slate-600 hover:text-primary-600 transition-colors border-b-2 border-transparent hover:border-primary-600 pb-1">
               Xem Tất Cả Bác Sĩ
             </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="w-8 h-[1px] bg-slate-900"></div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900">Bảng Giá Dịch Vụ</span>
              <div className="w-8 h-[1px] bg-slate-900"></div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-6">Chi Phí <span className="font-bold">Minh Bạch</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Cam kết mang đến dịch vụ y tế chất lượng cao với chi phí hợp lý, rõ ràng. Không phát sinh ẩn phí.</p>
          </div>

          {loadingServices ? (
            <div className="flex justify-center py-12">
               <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : apiServices.length === 0 ? (
            <p className="text-slate-500 text-center italic">Bảng giá chi tiết các dịch vụ khám chữa bệnh đang được cập nhật...</p>
          ) : (
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-8 lg:p-12 grid md:grid-cols-2 gap-x-16 gap-y-12">
                {Object.entries(
                    apiServices.reduce((acc, service) => {
                        const dept = service.department || 'Dịch vụ khác';
                        if (!acc[dept]) acc[dept] = [];
                        acc[dept].push(service);
                        return acc;
                    }, {})
                ).map(([department, deptServices]) => (
                  <div key={department}>
                    <h3 className="text-sm font-bold tracking-widest uppercase text-primary-600 mb-6 border-b border-slate-100 pb-3">
                      {department}
                    </h3>
                    <div className="space-y-4">
                      {deptServices.map(service => (
                        <div key={service.id} className="flex justify-between items-center group">
                          <span className="text-sm font-medium text-slate-700 group-hover:text-primary-700 transition-colors truncate pr-4" title={service.name}>{service.name}</span>
                          <div className="flex-1 border-b border-dashed border-slate-200 opacity-50 group-hover:border-primary-300 transition-colors"></div>
                          <span className="text-sm font-bold text-slate-900 pl-4 whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(service.price)} đ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Elegant CTA */}
      <section className="py-32 bg-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-8" strokeWidth={1} />
          <h2 className="text-4xl lg:text-5xl font-light text-slate-900 mb-8 leading-tight">
            Trải Nghiệm Sự Khác Biệt <br /> Của Y Tế <span className="font-bold">Thượng Lưu</span>
          </h2>
          <p className="text-slate-500 font-light text-lg mb-12">
            Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng đồng hành cùng sức khỏe của bạn.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="group relative inline-flex items-center justify-center overflow-hidden bg-slate-900 text-white px-12 py-5 text-sm font-semibold tracking-[0.1em] uppercase transition-all duration-300 hover:shadow-2xl"
          >
            <span className="relative z-10">Liên Hệ Đặt Lịch Hẹn</span>
            <div className="absolute inset-0 bg-primary-700 transform scale-x-0 origin-right group-hover:scale-x-100 transition-transform duration-500 ease-out z-0"></div>
          </button>
        </div>
      </section>

      {/* Footer Minimalist */}
      <footer id="contact" className="bg-slate-50 pt-24 pb-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-slate-900 flex items-center justify-center">
                  <div className="w-3 h-3 border border-white rounded-full"></div>
                </div>
                <span className="text-lg font-bold text-slate-900 tracking-widest uppercase">Kinh Bắc</span>
              </div>
              <p className="text-slate-500 font-light leading-relaxed max-w-sm mb-10">
                Biểu tượng của dịch vụ chăm sóc sức khỏe hoàn mỹ, nơi công nghệ tiên tiến và chuyên môn y học hàng đầu hội tụ.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 border border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors">
                  <span className="text-sm font-bold">F</span>
                </a>
                <a href="#" className="w-10 h-10 border border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors">
                  <span className="text-sm font-bold">In</span>
                </a>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900 mb-8">Liên Hệ</h4>
              <ul className="space-y-6 text-slate-500 font-light">
                <li className="flex gap-4">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>Số 1, Đường Lê Thái Tổ,<br />TP Từ Sơn, Bắc Ninh</span>
                </li>
                <li className="flex gap-4 items-center">
                  <PhoneCall className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.5} />
                  <span>1900 1234</span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-900 mb-8">Giờ Đón Khách</h4>
              <ul className="space-y-4 text-slate-500 font-light">
                <li className="flex justify-between border-b border-slate-200 pb-4">
                  <span>Thứ 2 - Thứ 6</span>
                  <span className="text-slate-900">07:00 - 20:00</span>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-4">
                  <span>Thứ 7</span>
                  <span className="text-slate-900">07:30 - 17:00</span>
                </li>
                <li className="flex justify-between pt-2">
                  <span>Chủ Nhật / Ngày lễ</span>
                  <span className="text-primary-600 font-medium">Khám theo yêu cầu ưu tiên</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 text-xs text-slate-400 tracking-wider">
            <p>&copy; {new Date().getFullYear()} Kinh Bắc Medical Center. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-900 transition-colors">Điều Khoản</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Bảo Mật</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
