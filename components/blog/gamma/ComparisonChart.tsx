'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ComparisonChartProps {
  title: string;
  data: ChartDataPoint[];
  chartType?: 'bar' | 'horizontal-bar' | 'pie' | 'donut';
  showPercentages?: boolean;
}

const COLORS = {
  blue: '#4F86F9',
  cyan: '#00D4FF',
  purple: '#8B5CF6',
  green: '#00FF88',
  red: '#FF4444',
  yellow: '#FFB800'
};

const DEFAULT_COLORS = [
  COLORS.blue,
  COLORS.cyan,
  COLORS.purple,
  COLORS.green,
  COLORS.yellow,
  COLORS.red
];

export default function ComparisonChart({
  title,
  data,
  chartType = 'bar',
  showPercentages = false
}: ComparisonChartProps) {
  // Map color names to hex values
  const chartData = data.map((item, index) => ({
    ...item,
    name: item.label,
    fill: item.color ? COLORS[item.color as keyof typeof COLORS] || DEFAULT_COLORS[index % DEFAULT_COLORS.length] : DEFAULT_COLORS[index % DEFAULT_COLORS.length]
  }));

  // Calculate percentages if needed
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentages = showPercentages 
    ? chartData.map(item => ({
        ...item,
        percentage: ((item.value / total) * 100).toFixed(1)
      }))
    : chartData;

  type ChartDataWithPercentage = typeof chartData[0] & { percentage?: string };

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={dataWithPercentages}
                cx="50%"
                cy="50%"
                innerRadius={chartType === 'donut' ? 80 : 0}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={showPercentages ? (entry: any) => `${entry.name}: ${entry.percentage}%` : undefined}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a2e', 
                  border: '1px solid #4F86F9',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#fff' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'horizontal-bar':
        return (
          <ResponsiveContainer width="100%" height={Math.max(300, data.length * 80)}>
            <BarChart 
              data={dataWithPercentages} 
              layout="vertical"
              margin={{ top: 20, right: 30, left: 140, bottom: 20 }}
            >
              <XAxis 
                type="number" 
                stroke="#A0A0B0"
                tick={{ fill: '#FFFFFF', fontSize: 14 }}
                tickFormatter={(value) => value.toLocaleString('en-GB')}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#A0A0B0" 
                width={130}
                tick={{ fill: '#FFFFFF', fontSize: 14 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a2e', 
                  border: '1px solid #4F86F9',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any) => [value.toLocaleString('en-GB'), 'Value']}
              />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      default: // 'bar'
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={dataWithPercentages}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis 
                dataKey="name" 
                stroke="#A0A0B0"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#FFFFFF', fontSize: 12 }}
              />
              <YAxis 
                stroke="#A0A0B0"
                tick={{ fill: '#FFFFFF', fontSize: 14 }}
                tickFormatter={(value) => value.toLocaleString('en-GB')}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a2e', 
                  border: '1px solid #4F86F9',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: any) => [value.toLocaleString('en-GB'), 'Value']}
              />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="my-12"
    >
      {/* Title */}
      <h3 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Chart Container */}
      <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8
                      hover:border-blue-500/50 transition-all duration-300 group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 
                        rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Chart */}
        <div className="relative">
          {renderChart()}
        </div>

        {/* Data Grid (optional, for reference) */}
        {showPercentages && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
            {(dataWithPercentages as ChartDataWithPercentage[]).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <div>
                  <div className="text-white font-semibold">{item.name}</div>
                  <div className="text-gray-400 text-sm">
                    {item.value.toLocaleString()} ({item.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

