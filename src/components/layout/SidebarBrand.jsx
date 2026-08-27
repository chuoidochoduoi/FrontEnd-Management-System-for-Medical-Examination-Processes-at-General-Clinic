// src/components/layout/SidebarBrand.jsx
import logoUrl from '@/assets/logo.jpg';

export default function SidebarBrand() {
    return (
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-3">
            <img src={logoUrl} alt="CareS Logo" className="w-8 h-8 rounded-md object-contain" />
            <div>
                <p className="text-sm font-bold text-gray-900">CareS</p>
                <p className="text-xs text-gray-400 mt-0.5">Phòng khám đa khoa</p>
            </div>
        </div>
    );
}
