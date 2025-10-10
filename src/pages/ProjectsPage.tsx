import React from 'react';
import { ExternalLink, Calendar, Users, TrendingUp } from 'lucide-react';

const ProjectsPage = () => {
  const projects = [
    {
      title: 'Healthcare AI Diagnostic System',
      client: 'MediCare Solutions',
      industry: 'Healthcare',
      description: 'Developed an AI-powered diagnostic system that analyzes medical images with 95% accuracy, reducing diagnosis time by 60%.',
      technologies: ['TensorFlow', 'Python', 'Computer Vision', 'Cloud Infrastructure'],
      results: ['95% diagnostic accuracy', '60% faster diagnosis', '500+ patients served daily'],
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
      year: '2023'
    },
    {
      title: 'Financial Fraud Detection Platform',
      client: 'SecureBank Corp',
      industry: 'Finance',
      description: 'Built a real-time fraud detection system using machine learning algorithms that reduced fraudulent transactions by 85%.',
      technologies: ['Machine Learning', 'Real-time Analytics', 'AWS', 'Apache Kafka'],
      results: ['85% reduction in fraud', '$2M+ in prevented losses', '99.9% uptime'],
      image: 'https://images.pexels.com/photos/6693655/pexels-photo-6693655.jpeg?auto=compress&cs=tinysrgb&w=800',
      year: '2023'
    },
    {
      title: 'Smart Manufacturing Optimization',
      client: 'TechManufacturing Inc',
      industry: 'Manufacturing',
      description: 'Implemented IoT sensors and AI algorithms to optimize production lines, resulting in 30% increased efficiency.',
      technologies: ['IoT', 'Predictive Analytics', 'Edge Computing', 'React Dashboard'],
      results: ['30% efficiency increase', '40% reduced downtime', '$500K annual savings'],
      image: 'https://images.pexels.com/photos/3912979/pexels-photo-3912979.jpeg?auto=compress&cs=tinysrgb&w=800',
      year: '2022'
    },
    {
      title: 'E-commerce Recommendation Engine',
      client: 'ShopSmart Retail',
      industry: 'E-commerce',
      description: 'Created a personalized product recommendation system that increased sales conversion by 45%.',
      technologies: ['Collaborative Filtering', 'Deep Learning', 'MongoDB', 'Node.js'],
      results: ['45% higher conversions', '25% increased revenue', '2M+ personalized recommendations'],
      image: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800',
      year: '2022'
    },
    {
      title: 'Supply Chain Analytics Platform',
      client: 'Global Logistics Ltd',
      industry: 'Logistics',
      description: 'Developed a comprehensive analytics platform for supply chain optimization and predictive inventory management.',
      technologies: ['Data Analytics', 'Predictive Modeling', 'PowerBI', 'SQL Server'],
      results: ['20% cost reduction', '15% faster deliveries', '95% demand forecast accuracy'],
      image: 'https://images.pexels.com/photos/4481327/pexels-photo-4481327.jpeg?auto=compress&cs=tinysrgb&w=800',
      year: '2021'
    },
    {
      title: 'Educational Learning Management System',
      client: 'EduTech University',
      industry: 'Education',
      description: 'Built an AI-powered LMS with adaptive learning capabilities serving 50,000+ students worldwide.',
      technologies: ['Natural Language Processing', 'Adaptive Learning', 'React', 'PostgreSQL'],
      results: ['50K+ active users', '30% improved learning outcomes', '98% student satisfaction'],
      image: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800',
      year: '2021'
    }
  ];

  return (
    <div className="py-12">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-900 to-cyan-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Projects</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Discover how we've helped businesses across industries achieve remarkable results through innovative AI solutions.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured Project Highlights
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each project represents our commitment to delivering innovative solutions that drive real business value.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {projects.map((project, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group">
                <div className="relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {project.industry}
                  </div>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {project.year}
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex items-center mb-3">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-500">{project.client}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{project.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Technologies Used:</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Key Results:
                    </h4>
                    <div className="space-y-2">
                      {project.results.map((result, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-gray-700 text-sm">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Project Success Metrics
            </h2>
            <p className="text-xl text-blue-100">
              Numbers that demonstrate our commitment to excellence
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Projects Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-blue-100">Industries Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectsPage;
