import React from 'react';
import { FEATURES } from '../../constants/content';
import FeatureItem from '../ui/FeatureItem';

const Features = () => (
  <section className="py-16 px-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {FEATURES.map((feature, idx) => (
        <FeatureItem
          key={idx}
          title={feature.title}
          icon={feature.icon}
        />
      ))}
    </div>

  </section>
);

export default Features;