// ============================================================================
// LIGHTPOINT BLOG V2 - CLEAN SLATE REBUILD
// Matches Gamma output quality with native React components
// ============================================================================

// Main renderer
export { BlogRenderer, SectionWrapper, componentRegistry } from './BlogRenderer';

// All components
export {
  HeroSection,
  StatsRow,
  TextWithImage,
  NumberedSteps,
  ThreeColumnCards,
  Timeline,
  ComparisonCards,
  DonutChart,
  CalloutBox,
  QuoteBlock,
  Paragraph,
  SectionHeading,
  BulletList,
  CTASection,
  getComponent,
} from './components';

// Types
export type {
  BlogLayout,
  LayoutComponent,
  ComponentType,
  HeroSectionProps,
  StatsRowProps,
  Stat,
  TextWithImageProps,
  NumberedStepsProps,
  Step,
  ThreeColumnCardsProps,
  Card,
  CardCallout,
  TimelineProps,
  TimelineEvent,
  ComparisonCardsProps,
  ComparisonCard,
  DonutChartProps,
  ChartSegment,
  CalloutBoxProps,
  QuoteBlockProps,
  ParagraphProps,
  SectionHeadingProps,
  BulletListProps,
  CTASectionProps,
  BlogPostMeta,
  BlogPostData,
  DetectedSection,
  ParsedContent,
} from './types';

// Theme tokens
export { theme, colors, typography, spacing, borders, shadows, tw, componentDefaults } from './themeTokens';

// Utilities - Layout generation
export { 
  SectionDetector, 
  detectSections, 
  generateLayout, 
  extractMeta, 
  stripFrontmatter, 
  markdownToLayout 
} from './utils';
export type { DetectedSection as UtilDetectedSection, GenerateLayoutOptions } from './utils';

// Example layout for testing
export { hmrcComplaintsBlogLayout } from './exampleLayout';

