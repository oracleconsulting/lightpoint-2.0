// ============================================================================
// LIGHTPOINT BLOG COMPONENT TYPES
// Clean slate rebuild - all component interfaces
// ============================================================================

// ----------------------------------------------------------------------------
// BASE TYPES
// ----------------------------------------------------------------------------

export interface BaseComponentProps {
  className?: string;
  id?: string;
}

// ----------------------------------------------------------------------------
// HERO SECTION
// ----------------------------------------------------------------------------

export interface HeroSectionProps extends BaseComponentProps {
  title: string;
  subtitle: string;
  readingTime?: string;
  author?: string;
  publishDate?: string;
  backgroundImage?: string;
  backgroundGradient?: boolean;
}

// ----------------------------------------------------------------------------
// STATS ROW
// ----------------------------------------------------------------------------

export interface Stat {
  value: string;        // "92K", "98%", "£12K"
  label: string;        // "Annual Complaints"
  description: string;  // "One complaint every six minutes"
}

export interface StatsRowProps extends BaseComponentProps {
  stats: Stat[];
  variant?: 'flat' | 'ring';
  columns?: 3 | 4;
  centered?: boolean;
}

// ----------------------------------------------------------------------------
// TEXT WITH IMAGE
// ----------------------------------------------------------------------------

export interface TextWithImageProps extends BaseComponentProps {
  title?: string;
  paragraphs: string[];
  imageSrc?: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  imageCaption?: string;
}

// ----------------------------------------------------------------------------
// NUMBERED STEPS
// ----------------------------------------------------------------------------

export interface Step {
  number?: string;      // "01", "02" - auto-generated if missing
  title: string;
  description: string;
}

export interface NumberedStepsProps extends BaseComponentProps {
  title?: string;
  intro?: string;
  steps: Step[];
  conclusion?: string;
  variant?: 'vertical' | 'grid';
}

// ----------------------------------------------------------------------------
// THREE COLUMN CARDS
// ----------------------------------------------------------------------------

export interface CardCallout {
  label: string;        // "Instead:"
  text: string;
}

export interface Card {
  icon?: boolean | string;  // true = dark circle, string = emoji/icon
  title: string;
  description: string;
  callout?: CardCallout;
}

export interface ThreeColumnCardsProps extends BaseComponentProps {
  title?: string;
  intro?: string;
  cards: Card[];
  background?: 'white' | 'gray';
}

// ----------------------------------------------------------------------------
// TIMELINE
// ----------------------------------------------------------------------------

export interface TimelineEvent {
  date: string;
  description: string;
  type?: 'neutral' | 'positive' | 'negative';
}

export interface TimelineProps extends BaseComponentProps {
  title?: string;
  intro?: string;
  events: TimelineEvent[];
  quote?: string;
  quoteAttribution?: string;
}

// ----------------------------------------------------------------------------
// COMPARISON CARDS
// ----------------------------------------------------------------------------

export interface ComparisonCard {
  title: string;        // "The Old Way"
  content: string;      // Can include → arrows for steps
  footer: string;       // "Timeline: 3-6 months"
}

export interface ComparisonCardsProps extends BaseComponentProps {
  title?: string;
  intro?: string;
  leftCard: ComparisonCard;
  rightCard: ComparisonCard;
  conclusion?: string;
}

// ----------------------------------------------------------------------------
// DONUT CHART
// ----------------------------------------------------------------------------

export interface ChartSegment {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps extends BaseComponentProps {
  title?: string;
  segments: ChartSegment[];
  size?: number;
  showLegend?: boolean;
  centerLabel?: string;
}

// ----------------------------------------------------------------------------
// CALLOUT BOX
// ----------------------------------------------------------------------------

export interface CalloutBoxProps extends BaseComponentProps {
  icon?: string;        // "💡", "⚠️", "📌", etc.
  label: string;        // "Pro Tip:"
  text: string;
  variant?: 'blue' | 'border' | 'gold';
}

// ----------------------------------------------------------------------------
// QUOTE BLOCK
// ----------------------------------------------------------------------------

export interface QuoteBlockProps extends BaseComponentProps {
  text: string;
  attribution?: string;
  source?: string;
  variant?: 'border' | 'box' | 'large';
}

// ----------------------------------------------------------------------------
// PARAGRAPH (FALLBACK)
// ----------------------------------------------------------------------------

export interface ParagraphProps extends BaseComponentProps {
  text: string;
  highlight?: boolean;
}

// ----------------------------------------------------------------------------
// SECTION HEADING
// ----------------------------------------------------------------------------

export interface SectionHeadingProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  icon?: string;
  centered?: boolean;
}

// ----------------------------------------------------------------------------
// BULLET LIST
// ----------------------------------------------------------------------------

export interface BulletListProps extends BaseComponentProps {
  title?: string;
  items: string[];
  variant?: 'bullet' | 'check' | 'arrow';
}

// ----------------------------------------------------------------------------
// IMAGE PLACEHOLDER
// ----------------------------------------------------------------------------

export interface ImagePlaceholderProps extends BaseComponentProps {
  alt: string;
  aspectRatio?: '4/3' | '16/9' | '1/1' | '3/2';
  caption?: string;
}

// ----------------------------------------------------------------------------
// CTA SECTION
// ----------------------------------------------------------------------------

export interface CTASectionProps extends BaseComponentProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  variant?: 'default' | 'highlight';
}

// ----------------------------------------------------------------------------
// LAYOUT STRUCTURE
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
  | 'imagePlaceholder'
  | 'cta';

export interface LayoutComponent {
  type: ComponentType;
  props: Record<string, unknown>;
}

export interface BlogLayout {
  theme?: {
    mode?: 'light' | 'dark';
    name?: string;
  };
  components: LayoutComponent[];
}

// ----------------------------------------------------------------------------
// BLOG POST DATA
// ----------------------------------------------------------------------------

export interface BlogPostMeta {
  title: string;
  slug: string;
  excerpt: string;
  author?: string;
  readingTime?: string;
  publishDate?: string;
  featuredImage?: string;
  tags?: string[];
}

export interface BlogPostData {
  meta: BlogPostMeta;
  content: string;        // Raw markdown
  layout?: BlogLayout;    // Generated layout
}

// ----------------------------------------------------------------------------
// SECTION DETECTION
// ----------------------------------------------------------------------------

export interface DetectedSection {
  type: ComponentType;
  content: unknown;
  startLine: number;
  endLine: number;
  confidence: number;     // 0-1, how confident the detection is
}

export interface ParsedContent {
  meta: BlogPostMeta;
  sections: DetectedSection[];
}

// ----------------------------------------------------------------------------
// COMPONENT REGISTRY
// ----------------------------------------------------------------------------

export type ComponentRegistry = {
  [K in ComponentType]: React.ComponentType<Record<string, unknown>>;
};

