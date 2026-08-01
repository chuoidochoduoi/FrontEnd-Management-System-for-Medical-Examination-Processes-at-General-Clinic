const fs = require('fs');
const path = require('path');
const layouts = ['AdminLayout.jsx', 'CashierLayout.jsx', 'MedicalStaffLayout.jsx', 'OwnerLayout.jsx', 'ReceptionistLayout.jsx'];

layouts.forEach(layout => {
    const p = path.join('src', 'components', 'layout', layout);
    let content = fs.readFileSync(p, 'utf8');

    // Remove Receptionist support
    content = content.replace(/<NavLink to=\{ROUTES\.RECEPTIONIST_SUPPORT\}[\s\S]*?<\/NavLink>/g, '');

    // Remove Cashier bottomNav usage and definition
    content = content.replace(/\{bottomNav\.map[\s\S]*?\)\)\}/g, '');
    content = content.replace(/const bottomNav = \[[\s\S]*?\];/g, '');

    // Fix Settings text replacing the entire block
    content = content.replace(/<NavLink to=\{ROUTES\.SETTINGS\}[\s\S]*?<Settings size=\{15\} className=\"shrink-0\" \/>[\s\S]*?<\/NavLink>/g, '<NavLink to={ROUTES.SETTINGS} className={linkClass}>\n                        <Settings size={15} className=\"shrink-0\" />\n                        Cài đặt\n                    </NavLink>');

    fs.writeFileSync(p, content, 'utf8');
});
console.log('Fixed layouts');
