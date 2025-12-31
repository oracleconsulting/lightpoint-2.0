// ============================================================================
// SECTION GROUPER
// Takes a flat component array and organizes into visually distinct sections
// ============================================================================

import type { LayoutComponent, ComponentType, SectionGroup } from '../types';

// Re-export SectionGroup for convenience
export type { SectionGroup } from '../types';

// Background pattern for alternating sections
const BACKGROUND_PATTERN: Array<'white' | 'gray'> = ['white', 'gray'];

interface GroupingOptions {
  maxComponentsPerSection?: number;
  forceAlternatingBackgrounds?: boolean;
}

/**
 * Groups a flat array of components into logical sections
 * with alternating backgrounds for visual rhythm
 */
export function groupIntoSections(
  components: LayoutComponent[],
  options: GroupingOptions = {}
): SectionGroup[] {
  const {
    maxComponentsPerSection = 4,
    forceAlternatingBackgrounds = true,
  } = options;

  const sections: SectionGroup[] = [];
  let currentSection: LayoutComponent[] = [];
  let sectionIndex = 0;

  const flushSection = (background?: 'white' | 'gray' | 'dark' | 'gradient') => {
    if (currentSection.length === 0) return;

    const bg = background || 
      (forceAlternatingBackgrounds 
        ? BACKGROUND_PATTERN[sectionIndex % 2]
        : 'white');

    sections.push({
      id: `section-${sectionIndex}`,
      background: bg,
      spacing: 'normal',
      components: [...currentSection],
    });

    currentSection = [];
    sectionIndex++;
  };

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const type = component.type as ComponentType;

    // Hero always gets its own section with no padding (it has its own)
    if (type === 'hero') {
      flushSection();
      sections.push({
        id: 'hero',
        background: 'white', // Hero handles its own background
        spacing: 'tight',
        components: [component],
      });
      sectionIndex++;
      continue;
    }

    // CTA always gets its own section
    if (type === 'cta') {
      flushSection();
      sections.push({
        id: 'cta',
        background: 'gray',
        spacing: 'normal',
        components: [component],
      });
      sectionIndex++;
      continue;
    }

    // Letter template gets its own section with gray background
    if (type === 'letterTemplate' || type === 'template' || type === 'formalLetter') {
      flushSection();
      sections.push({
        id: `letter-${sectionIndex}`,
        background: 'gray',
        spacing: 'normal',
        components: [component],
      });
      sectionIndex++;
      continue;
    }

    // Section heading starts a new section
    if (type === 'sectionHeading') {
      flushSection();
      currentSection.push(component);
      continue;
    }

    // Add to current section
    currentSection.push(component);

    // Flush if we hit max components
    if (currentSection.length >= maxComponentsPerSection) {
      flushSection();
    }
  }

  // Flush any remaining components
  flushSection();

  return sections;
}

/**
 * Smart grouping that understands content relationships
 * Groups section headings with their following content
 */
export function smartGroupIntoSections(
  components: LayoutComponent[]
): SectionGroup[] {
  const sections: SectionGroup[] = [];
  let currentSection: LayoutComponent[] = [];
  let sectionIndex = 0;
  let lastWasSectionHeading = false;

  const flushSection = (overrides?: Partial<SectionGroup>) => {
    if (currentSection.length === 0) return;

    sections.push({
      id: `section-${sectionIndex}`,
      background: BACKGROUND_PATTERN[sectionIndex % 2],
      spacing: 'normal',
      components: [...currentSection],
      ...overrides,
    });

    currentSection = [];
    sectionIndex++;
  };

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    const type = component.type as ComponentType;
    const nextComponent = components[i + 1];
    const nextType = nextComponent?.type as ComponentType;

    // Hero - standalone section
    if (type === 'hero') {
      flushSection();
      sections.push({
        id: 'hero',
        background: 'white',
        spacing: 'tight',
        components: [component],
      });
      sectionIndex = 1; // Start alternation after hero
      continue;
    }

    // CTA - standalone section
    if (type === 'cta') {
      flushSection();
      sections.push({
        id: 'cta',
        background: 'gray',
        spacing: 'relaxed',
        components: [component],
      });
      sectionIndex++;
      continue;
    }

    // Letter template - standalone section with special styling
    if (type === 'letterTemplate' || type === 'template' || type === 'formalLetter') {
      flushSection();
      sections.push({
        id: `letter-${sectionIndex}`,
        background: 'gray', // Gray background to make the document pop
        spacing: 'normal',
        components: [component],
      });
      sectionIndex++;
      continue;
    }

    // Section heading - start new section, group with following content
    if (type === 'sectionHeading') {
      // If we have accumulated content, flush it first
      if (currentSection.length > 0 && !lastWasSectionHeading) {
        flushSection();
      }
      currentSection.push(component);
      lastWasSectionHeading = true;
      continue;
    }

    lastWasSectionHeading = false;

    // Add component to current section
    currentSection.push(component);

    // Decide when to flush based on content patterns
    const shouldFlush = shouldStartNewSection(
      type,
      nextType,
      currentSection.length
    );

    if (shouldFlush) {
      flushSection();
    }
  }

  // Flush remaining
  flushSection();

  return sections;
}

/**
 * Determines if we should start a new section after this component
 */
function shouldStartNewSection(
  currentType: ComponentType,
  nextType: ComponentType | undefined,
  currentSectionSize: number
): boolean {
  // Max 5 components per section (keeps things manageable)
  if (currentSectionSize >= 5) return true;

  // If next is a section heading, flush current
  if (nextType === 'sectionHeading') return true;

  // If next is CTA, flush current
  if (nextType === 'cta') return true;

  // After comparison cards with 2+ items
  if (currentType === 'comparisonCards' && currentSectionSize >= 2) return true;

  // After timeline/steps with 2+ items
  if ((currentType === 'timeline' || currentType === 'numberedSteps') && currentSectionSize >= 2) return true;

  // After threeColumnCards with 3+ items in section
  if (currentType === 'threeColumnCards' && currentSectionSize >= 3) return true;

  return false;
}

export default {
  groupIntoSections,
  smartGroupIntoSections,
};

