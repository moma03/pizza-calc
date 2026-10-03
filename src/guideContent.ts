import type { TFunction } from 'i18next';
import type { Method } from './lib/fermentation';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface GuideContent {
  title: string;
  intro: string;
  /** Sections specific to this method's page. */
  methodSections: GuideSection[];
  /** Sections every page shares. */
  sharedSections: GuideSection[];
  faq: FaqItem[];
}

const list = <T>(t: TFunction, key: string): T[] => {
  const value: unknown = t(key, { returnObjects: true });
  return Array.isArray(value) ? (value as T[]) : [];
};

/**
 * The text under the calculator for one method's page: its own sections and
 * questions first, then the ones every page shares. Used both for the page and
 * for its FAQ structured data, which must match what the page shows.
 */
export const guideContent = (t: TFunction, method: Method): GuideContent => ({
  title: t(`pages.${method}.guideTitle`),
  intro: t(`pages.${method}.intro`),
  methodSections: list<GuideSection>(t, `pages.${method}.sections`),
  sharedSections: list<GuideSection>(t, 'guide.sections'),
  faq: [...list<FaqItem>(t, `pages.${method}.faq`), ...list<FaqItem>(t, 'guide.faq.items')],
});
