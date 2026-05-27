import React from 'react';
import Button from '../ui/Button';

const CTA = () => (
  <section className="py-12 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
    <Button className="w-full sm:w-auto px-10 py-4 text-lg">
      View System Modules
      <ArrowRightIcon />
    </Button>
    <Button variant="secondary" className="w-full sm:w-auto px-10 py-4 text-lg">
      Explore Workflow
    </Button>
  </section>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default CTA;
