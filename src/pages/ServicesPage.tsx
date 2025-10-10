import React from 'react';
import { Brain, Database, Cloud, Cog, BarChart3, Shield, Zap, Users } from 'lucide-react';

const ServicesPage = () => {
  const services = [
    {
      icon: Brain,
      title: 'Machine Learning & AI Development',
      description: 'Custom AI models and machine learning solutions tailored to your specific business needs.',
      features: ['Deep Learning Models', 'Natural Language Processing', 'Computer Vision', 'Predictive Analytics'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Database,
      title: 'Data Analytics & Business Intelligence',
      description: 'Transform raw data into actionable insights with our comprehensive analytics solutions.',
      features: ['Data Visualization', 'Real-time Dashboards', 'Statistical Analysis', 'Data Mining'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Cloud,
      title: 'Cloud Infrastructure & DevOps',
      description: 'Scalable cloud solutions and DevOps practices to accelerate your digital transformation.',
      features: ['Cloud Migration', 'Container Orchestration', 'CI/CD Pipelines', 'Infrastructure Automation'],
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: Cog,
      title: 'Process Automation',
      description: 'Automate repetitive tasks and workflows to improve efficiency and reduce operational costs.',
      features: ['Robotic Process Automation', 'Workflow Optimization', 'Integration Solutions', 'API Development'],
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: BarChart3,
      title: 'Digital Transformation Consulting',
      description: 'Strategic guidance to help organizations navigate their digital transformation journey.',
      features: ['Technology Strategy', 'Change Management', 'Digital Roadmaps', 'Performance Optimization'],
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Shield,
      title: 'Cybersecurity Solutions',
      description: 'Comprehensive security solutions to protect your digital assets and infrastructure.',
      features: ['Security Audits', 'Threat Detection', 'Compliance Management', 'Incident Response'],
      color: 'from-red-500 to-pink-500'
    }
  ];

  const industries = [
    { name: 'Healthcare', icon: '🏥', description: 'AI-powered diagnostic tools and patient management systems' },
    { name: 'Finance', icon: '💰', description: 'Fraud detection, risk assessment, and automated trading solutions' },
    { name: 'Manufacturing', icon: '🏭', description: 'Predictive maintenance and quality control automation' },
    { name: 'Retail', icon: '🛍️', description: 'Personalized recommendations and inventory optimization' },
    { name: 'Education', icon: '🎓', description: 'Adaptive learning platforms and administrative automation' },
    { name: 'Logistics', icon: '🚚', description: 'Route optimization and supply chain management' }
  ];

  return (
    <div className="py-12">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-900 to-cyan-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Comprehensive AI and technology solutions designed to drive innovation and growth for your business.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Complete Technology Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From AI development to cloud infrastructure, we provide end-to-end solutions that transform businesses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-8 group">
                <div className={`bg-gradient-to-r ${service.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6 group-hover:shadow-lg transition-shadow`}>
                  <service.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <div className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Industries We Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our solutions have been successfully implemented across various industries, delivering measurable results.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow group">
                <div className="text-4xl mb-4">{industry.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {industry.name}
                </h3>
                <p className="text-gray-600">{industry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We follow a proven methodology to ensure successful project delivery and long-term value.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Discovery', description: 'Understanding your business needs and challenges' },
              { step: '02', title: 'Planning', description: 'Developing a comprehensive solution strategy' },
              { step: '03', title: 'Implementation', description: 'Building and deploying your custom solution' },
              { step: '04', title: 'Support', description: 'Ongoing maintenance and optimization' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;