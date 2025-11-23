'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
}

interface CaseStudy {
  title: string;
  metric: string;
  value: string;
  description: string;
  color: 'blue' | 'green' | 'purple';
}

export function SocialProofSection() {
  const testimonials: Testimonial[] = [
    {
      quote: "Coming soon - we're gathering feedback from our beta users.",
      author: "Beta Programme",
      role: "Active Development",
      company: "Lightpoint Platform",
      rating: 5,
    },
  ];

  const caseStudies: CaseStudy[] = [
    {
      title: "Platform Launch",
      metric: "Coming Soon",
      value: "Q1 2025",
      description: "Real results from real firms",
      color: "blue",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4"
          >
            <Star className="h-4 w-4 fill-current" />
            Building with Leading Firms
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 mb-4"
          >
            Launching Q1 2025
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Join the waitlist to be among the first accounting firms using Lightpoint
          </motion.p>
        </div>

        {/* Case Studies - Platform Launch Info */}
        <div className="grid md:grid-cols-1 gap-6 mb-16 max-w-2xl mx-auto">
          {caseStudies.map((study, idx) => {
            const colorClasses = {
              green: 'from-green-500 to-emerald-500',
              blue: 'from-blue-500 to-indigo-500',
              purple: 'from-purple-500 to-pink-500',
            };

            return (
              <motion.div
                key={study.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative glass rounded-2xl p-6 border border-gray-200/50 hover:border-gray-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient background glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[study.color]} opacity-0 group-hover:opacity-10 transition-opacity blur-2xl`} />
                
                <div className="relative z-10">
                  <div className="text-sm text-gray-600 mb-2">{study.title}</div>
                  <div className={`text-4xl font-bold bg-gradient-to-r ${colorClasses[study.color]} bg-clip-text text-transparent mb-1`}>
                    {study.value}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">{study.metric}</div>
                  <div className="text-xs text-gray-500">{study.description}</div>
                </div>

                {/* Decorative corner */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorClasses[study.color]} opacity-10 rounded-bl-full`} />
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-1 gap-6 max-w-2xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative glass rounded-2xl p-6 border border-gray-200/50 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-12 w-12 text-blue-600" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed mb-6 relative z-10">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{testimonial.author}</div>
                  <div className="text-xs text-gray-500">{testimonial.role}</div>
                  <div className="text-xs text-gray-400">{testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Logo Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-500 mb-6">In development for professionals at firms like:</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {['Accounting Firms', 'Tax Advisors', 'Bookkeepers', 'Financial Consultants'].map((firm) => (
              <div key={firm} className="text-base font-bold text-gray-700 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                {firm}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

