'use client';

/**
 * Chart Components for Blog Posts
 * Uses Recharts for responsive, beautiful data visualizations
 */

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================
// BAR CHART COMPONENT
// ============================================
interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BlogBarChartProps {
  data: BarChartData[];
  title?: string;
  description?: string;
  xKey?: string;
  yKey?: string;
  color?: string;
  height?: number;
}

export function BlogBarChart({
  data,
  title,
  description,
  xKey = 'name',
  yKey = 'value',
  color = '#3b82f6',
  height = 400,
}: BlogBarChartProps) {
  return (
    <div className="my-8 bg-white rounded-xl border-2 border-gray-200 p-6">
      {title && <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey={yKey} fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// LINE CHART COMPONENT
// ============================================
interface LineChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BlogLineChartProps {
  data: LineChartData[];
  title?: string;
  description?: string;
  xKey?: string;
  lines: Array<{
    key: string;
    color: string;
    name: string;
  }>;
  height?: number;
}

export function BlogLineChart({
  data,
  title,
  description,
  xKey = 'name',
  lines,
  height = 400,
}: BlogLineChartProps) {
  return (
    <div className="my-8 bg-white rounded-xl border-2 border-gray-200 p-6">
      {title && <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={3}
              name={line.name}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// PIE CHART / DONUT CHART COMPONENT
// ============================================
interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface BlogPieChartProps {
  data: PieChartData[];
  title?: string;
  description?: string;
  isDonut?: boolean;
  height?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function BlogPieChart({
  data,
  title,
  description,
  isDonut = false,
  height = 400,
}: BlogPieChartProps) {
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  return (
    <div className="my-8 bg-white rounded-xl border-2 border-gray-200 p-6">
      {title && <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={isDonut ? 120 : 150}
            innerRadius={isDonut ? 60 : 0}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// HORIZONTAL BAR CHART (Good for comparisons)
// ============================================
interface HorizontalBarChartProps {
  data: BarChartData[];
  title?: string;
  description?: string;
  color?: string;
  height?: number;
}

export function HorizontalBarChart({
  data,
  title,
  description,
  color = '#3b82f6',
  height = 400,
}: HorizontalBarChartProps) {
  return (
    <div className="my-8 bg-white rounded-xl border-2 border-gray-200 p-6">
      {title && <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" />
          <YAxis dataKey="name" type="category" stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="value" fill={color} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// MULTI-SERIES BAR CHART (For comparisons)
// ============================================
interface MultiSeriesBarChartProps {
  data: BarChartData[];
  title?: string;
  description?: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
}

export function MultiSeriesBarChart({
  data,
  title,
  description,
  series,
  height = 400,
}: MultiSeriesBarChartProps) {
  return (
    <div className="my-8 bg-white rounded-xl border-2 border-gray-200 p-6">
      {title && <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.name} radius={[8, 8, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

