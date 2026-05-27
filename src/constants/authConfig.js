import { BriefcaseMedical } from 'lucide-react';
export const LOGIN_PAGE = {
  title: 'Login',
  subtitle: 'Please enter your information to access the medical management system.',
  social: [
    { id: 'google', label: 'Google', iconUrl: 'https://www.svgrepo.com/show/475656/google-color.svg' },
    { id: 'clinical', label: 'Clinical ID', icon: BriefcaseMedical }
  ],
  fields: [
    { name: 'email', type: 'email', label: 'Email', placeholder: 'example.medical@gmail.com', validators: ['required','email'], icon: 'user' },
    { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••', validators: ['required'], icon: 'lock' }
  ]
};

export default LOGIN_PAGE;
