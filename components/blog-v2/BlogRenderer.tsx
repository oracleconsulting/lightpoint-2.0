'use client';

import React from 'react';
import { componentRegistry } from './components';
import type { BlogLayout, LayoutComponent, ComponentType } from './types';

// ============================================================================
// BLOG RENDERER
// Single entry point for rendering blog posts from structured layouts
// ============================================================================

interface BlogRendererProps {
  layout: BlogLayout;
  className?: string;
}

/**
 * BlogRenderer - Renders a complete blog post from a structured layout
 * 
 * Usage:
 * ```tsx
 * <BlogRenderer layout={blogPost.layout} />
 * ```
 * 
 * The layout object contains:
 * - theme: Optional theme settings
 * - components: Array of { type, props } objects
 */
export function BlogRenderer({ layout, className = '' }: BlogRendererProps) {
  const { theme, components } = layout;

  // Apply theme classes if specified
  const themeClasses = theme?.mode === 'dark' 
    ? 'bg-slate-900 text-slate-100' 
    : 'bg-white';

  return (
    <div className={`min-h-screen font-sans ${themeClasses} ${className}`}>
      {components.map((component, index) => (
        <ComponentRenderer 
          key={`${component.type}-${index}`} 
          component={component} 
        />
      ))}
    </div>
  );
}

// ============================================================================
// COMPONENT RENDERER
// Renders individual components with error boundary
// ============================================================================

interface ComponentRendererProps {
  component: LayoutComponent;
}

function ComponentRenderer({ component }: ComponentRendererProps) {
  const { type, props } = component;

  // Get the component from registry
  const Component = componentRegistry[type as ComponentType];

  if (!Component) {
    console.warn(`Unknown component type: ${type}`);
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 m-4 rounded">
        <p className="text-yellow-800 text-sm">
          Unknown component type: <code>{type}</code>
        </p>
      </div>
    );
  }

  try {
    return <Component {...props} />;
  } catch (error) {
    console.error(`Error rendering component ${type}:`, error);
    return (
      <div className="bg-red-50 border border-red-200 p-4 m-4 rounded">
        <p className="text-red-800 text-sm">
          Error rendering: <code>{type}</code>
        </p>
      </div>
    );
  }
}

// ============================================================================
// SECTION WRAPPER
// Optional wrapper for adding consistent spacing between sections
// ============================================================================

interface SectionWrapperProps {
  children: React.ReactNode;
  background?: 'white' | 'gray' | 'none';
  className?: string;
}

export function SectionWrapper({ 
  children, 
  background = 'none',
  className = '' 
}: SectionWrapperProps) {
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    none: '',
  };

  return (
    <section className={`${bgClasses[background]} ${className}`}>
      <div className="max-w-5xl mx-auto px-8 py-16">
        {children}
      </div>
    </section>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BlogRenderer;

export { componentRegistry };

