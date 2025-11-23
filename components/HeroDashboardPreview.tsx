'use client';

import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';

/**
 * Floating dashboard preview for hero section
 * Shows a realistic preview of the platform with 3D tilt effect
 */
export function HeroDashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, rotateY: -15 }}
      animate={{ opacity: 1, x: 0, rotateY: 8 }}
      transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
      className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[600px] perspective-1000"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Main Dashboard Card */}
      <div className="relative glass rounded-2xl shadow-2xl border border-white/30 p-6 backdrop-blur-xl bg-white/10 transform rotate-y-6 hover:rotate-y-0 transition-transform duration-500">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg">Active Complaints</h3>
            <p className="text-blue-200 text-sm">Real-time dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-300">Live</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Active', value: '23', icon: FileText, color: 'blue' },
            { label: 'Success', value: '89%', icon: CheckCircle, color: 'green' },
            { label: 'Avg. Days', value: '42', icon: Clock, color: 'amber' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="glass rounded-lg p-3 border border-white/20"
            >
              <stat.icon className={`h-4 w-4 text-${stat.color}-400 mb-1`} />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-blue-200">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          {[
            { text: 'Case #1247 escalated', status: 'warning', time: '2m ago' },
            { text: '£3,450 recovered - Case #1189', status: 'success', time: '5m ago' },
            { text: 'New PAYE complaint logged', status: 'info', time: '12m ago' },
          ].map((activity, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + i * 0.1 }}
              className="flex items-center gap-3 glass rounded-lg p-2 border border-white/10"
            >
              <div className={`h-2 w-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-400' :
                activity.status === 'warning' ? 'bg-amber-400' :
                'bg-blue-400'
              }`} />
              <div className="flex-1">
                <p className="text-white text-sm">{activity.text}</p>
                <p className="text-blue-200 text-xs">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating "Live Demo" Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: 'spring' }}
          className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg cursor-pointer hover:scale-110 transition-transform"
        >
          See it in action →
        </motion.div>

        {/* Floating Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.7, type: 'spring' }}
          className="absolute -bottom-6 -left-6 glass rounded-full p-4 border border-white/30"
        >
          <div className="relative w-16 h-16">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 0.89 }}
                transition={{ duration: 2, delay: 1.8 }}
                strokeDasharray="175.93"
                strokeDashoffset="0"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-sm font-bold">89%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Particles Around Dashboard */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            x: [0, Math.random() * 30 - 15, 0],
            y: [0, Math.random() * 30 - 15, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: 2 + i * 0.2,
          }}
          className="absolute w-2 h-2 bg-white rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </motion.div>
  );
}

/**
 * Floating trust badges
 */
export function FloatingTrustBadges() {
  const badges = [
    { text: 'GDPR Compliant', icon: '🔒' },
    { text: 'ISO 27001', icon: '✓' },
    { text: 'Bank-level Security', icon: '🛡️' },
  ];

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-10">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          className="glass rounded-full px-4 py-2 border border-white/30 flex items-center gap-2 hover:scale-110 transition-transform"
        >
          <span className="text-lg">{badge.icon}</span>
          <span className="text-sm text-white font-medium">{badge.text}</span>
        </motion.div>
      ))}
    </div>
  );
}

