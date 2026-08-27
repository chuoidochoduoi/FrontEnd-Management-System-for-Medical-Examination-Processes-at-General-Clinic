const fs = require('fs');
const files = ['MedicalStaffLayout.jsx','CashierLayout.jsx','AdminLayout.jsx','OwnerLayout.jsx'];

files.forEach(f => {
    const p = 'src/components/layout/' + f;
    if (!fs.existsSync(p)) return;
    let c = fs.readFileSync(p, 'utf8');
    
    if (!c.includes('NotificationBell')) {
        c = c.replace("import { ROUTES } from '@/constants/routes';", "import { ROUTES } from '@/constants/routes';\nimport NotificationBell from '@/components/ui/NotificationBell';");
        
        const target = '<div className="flex-1 flex flex-col overflow-hidden">\n                <main className="flex-1 overflow-y-auto p-8">';
        const replacement = '<div className="flex-1 flex flex-col overflow-hidden relative">\n                <header className="absolute top-4 right-8 z-10 bg-white shadow-sm rounded-full px-2 py-1 flex items-center border border-gray-100">\n                    <NotificationBell />\n                </header>\n                <main className="flex-1 overflow-y-auto p-8 pt-16">';
        
        c = c.replace(target, replacement);
        
        // Some might use CR LF
        const target2 = '<div className="flex-1 flex flex-col overflow-hidden">\r\n                <main className="flex-1 overflow-y-auto p-8">';
        const replacement2 = '<div className="flex-1 flex flex-col overflow-hidden relative">\r\n                <header className="absolute top-4 right-8 z-10 bg-white shadow-sm rounded-full px-2 py-1 flex items-center border border-gray-100">\r\n                    <NotificationBell />\r\n                </header>\r\n                <main className="flex-1 overflow-y-auto p-8 pt-16">';
        
        c = c.replace(target2, replacement2);
        
        fs.writeFileSync(p, c);
        console.log('Patched', f);
    }
});
