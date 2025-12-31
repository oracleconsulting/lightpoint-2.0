// ============================================================================
// LIGHTPOINT BLOG COMPONENT TYPES
// Type definitions for all blog components
// ============================================================================

// ----------------------------------------------------------------------------
// CORE TYPES
// ----------------------------------------------------------------------------

export type ComponentType = 
  | 'hero'
  | 'stats'
  | 'textWithImage'
  | 'numberedSteps'
  | 'threeColumnCards'
  | 'timeline'
  | 'comparisonCards'
  | 'donutChart'
  | 'callout'
  | 'quote'
  | 'paragraph'
  | 'sectionHeading'
  | 'bulletList'
  | 'cta'
  | 'letterTemplate'
  | 'template'
  | 'formalLetter';

export interface LayoutComponent {
  type: ComponentType;
  props: Record<string, any>;
}

export interface SectionGroup {
  id: string;
  background: 'white' | 'gray' | 'dark' | 'gradient';
  spacing?: 'tight' | 'normal' | 'relaxed';
  components: LayoutComponent[];
}

export interface LayoutTheme {
  mode?: 'light' | 'dark';
  name?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export interface BlogLayout {
  theme?: LayoutTheme;
  components?: LayoutComponent[];
  sections?: SectionGroup[]; // Section-based layout with alternating backgrounds
}

// ----------------------------------------------------------------------------
// COMPONENT PROP TYPES
// ----------------------------------------------------------------------------

export interface HeroSectionProps {
  title: string;
  subtitle: string;
  readingTime?: string;
  author?: string;
  publishDate?: string;
  backgroundImage?: string;
  backgroundGradient?: boolean;
  tags?: string[];
}

export interface Stat {
  value: string;
  label: string;
  description: string;
}

export interface StatsRowProps {
  stats: Stat[];
  variant?: 'flat' | 'ring';
  columns?: 3 | 4;
  title?: string;
}

export interface TextWithImageProps {
  title?: string;
  paragraphs: string[];
  imageSrc?: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  imageCaption?: string;
}

export interface Step {
  number?: string;
  title: string;
  description: string;
}

export interface NumberedStepsProps {
  title?: string;
  intro?: string;
  steps: Step[];
  conclusion?: string;
  variant?: 'vertical' | 'grid';
}

export interface CardCallout {
  label: string;
  text: string;
}

export interface Card {
  icon?: boolean | string;
  title: string;
  description: string;
  callout?: CardCallout;
}

export interface ThreeColumnCardsProps {
  title?: string;
  intro?: string;
  cards: Card[];
  background?: 'white' | 'gray';
}

export interface TimelineEvent {
  date: string;
  description: string;
  type?: 'neutral' | 'positive' | 'negative';
}

export interface TimelineProps {
  title?: string;
  intro?: string;
  events: TimelineEvent[];
  quote?: string;
  quoteAttribution?: string;
}

export interface ComparisonCard {
  title: string;
  content: string;
  footer: string;
}

export interface ComparisonCardsProps {
  title?: string;
  intro?: string;
  leftCard: ComparisonCard;
  rightCard: ComparisonCard;
  conclusion?: string;
}

export interface ChartSegment {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  title?: string;
  segments: ChartSegment[];
  size?: number;
  showLegend?: boolean;
  centerLabel?: string;
}

export interface CalloutBoxProps {
  icon?: string;
  label: string;
  text: string;
  variant?: 'blue' | 'border' | 'gold' | 'green';
}

export interface QuoteBlockProps {
  text: string;
  attribution?: string;
  source?: string;
  variant?: 'border' | 'box' | 'large';
}

export interface ParagraphProps {
  text: string;
  highlight?: boolean;
  dropcap?: boolean;
}

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: string;
  centered?: boolean;
  decorated?: boolean;
}

export interface BulletListProps {
  title?: string;
  items: string[];
  variant?: 'bullet' | 'check' | 'arrow' | 'number';
}

export interface CTASectionProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  variant?: 'default' | 'highlight';
}
