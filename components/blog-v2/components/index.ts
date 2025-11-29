// ============================================================================
// LIGHTPOINT BLOG COMPONENTS - BARREL EXPORT
// Clean slate rebuild - single import point for all components
// ============================================================================

// Core visual components
export { HeroSection } from './HeroSection';
export { StatsRow } from './StatsRow';
export { TextWithImage } from './TextWithImage';
export { NumberedSteps } from './NumberedSteps';
export { ThreeColumnCards } from './ThreeColumnCards';
export { Timeline } from './Timeline';
export { ComparisonCards } from './ComparisonCards';
export { DonutChart } from './DonutChart';
export { CalloutBox } from './CalloutBox';
export { QuoteBlock } from './QuoteBlock';

// Utility components
export { 
  Paragraph, 
  SectionHeading, 
  BulletList, 
  CTASection 
} from './UtilityComponents';

// Re-export types
export type {
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
  BlogLayout,
  LayoutComponent,
  ComponentType,
} from '../types';

// ============================================================================
// COMPONENT REGISTRY
// For dynamic rendering based on component type
// ============================================================================

import { HeroSection } from './HeroSection';
import { StatsRow } from './StatsRow';
import { TextWithImage } from './TextWithImage';
import { NumberedSteps } from './NumberedSteps';
import { ThreeColumnCards } from './ThreeColumnCards';
import { Timeline } from './Timeline';
import { ComparisonCards } from './ComparisonCards';
import { DonutChart } from './DonutChart';
import { CalloutBox } from './CalloutBox';
import { QuoteBlock } from './QuoteBlock';
import { 
  Paragraph, 
  SectionHeading, 
  BulletList, 
  CTASection 
} from './UtilityComponents';

import type { ComponentType } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentRegistry = Record<ComponentType, React.ComponentType<any>>;

export const componentRegistry: ComponentRegistry = {
  hero: HeroSection,
  stats: StatsRow,
  textWithImage: TextWithImage,
  numberedSteps: NumberedSteps,
  threeColumnCards: ThreeColumnCards,
  timeline: Timeline,
  comparisonCards: ComparisonCards,
  donutChart: DonutChart,
  callout: CalloutBox,
  quote: QuoteBlock,
  paragraph: Paragraph,
  sectionHeading: SectionHeading,
  bulletList: BulletList,
  imagePlaceholder: Paragraph, // Fallback
  cta: CTASection,
};

export function getComponent(type: ComponentType) {
  return componentRegistry[type] || Paragraph;
}

