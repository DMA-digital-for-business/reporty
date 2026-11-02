'use client';

import { Accordion } from '@base-ui/react/accordion';
import { Plus } from 'lucide-react';
import styles from './landing.module.css';

export function FaqAccordion({ items }: { items: readonly (readonly [string, string])[] }) {
  return <Accordion.Root className={styles.faqList} multiple keepMounted data-reveal data-reveal-delay="90">
    {items.map(([question, answer]) => <Accordion.Item key={question} value={question} className={styles.faqItem}>
      <Accordion.Header>
        <Accordion.Trigger className={styles.faqTrigger}>{question}<span className={styles.faqIcon}><Plus size={17} aria-hidden="true" /></span></Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className={styles.faqPanel}><div className={styles.faqContent}><p>{answer}</p></div></Accordion.Panel>
    </Accordion.Item>)}
  </Accordion.Root>;
}
