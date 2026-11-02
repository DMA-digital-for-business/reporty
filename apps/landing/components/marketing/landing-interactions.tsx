'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dashboardLoginUrl } from '@/lib/links';
import { ArrowRight, Check } from 'lucide-react';
import { buttonVariants } from '@reporty/shared/ui/button';
import styles from './landing.module.css';

export { ProductDemo } from './product-demo';

const plans = [
  { name: 'Starter', description: 'Il tuo prossimo progetto, con le idee chiare.', monthly: 19, yearly: 15, projects: '3 progetti attivi', environments: '3 ambienti per progetto', audience: 'Per freelance e piccoli studi', featured: false },
  { name: 'Studio', description: 'Più clienti. Un unico flusso di revisione.', monthly: 49, yearly: 39, projects: '15 progetti attivi', environments: '5 ambienti per progetto', audience: 'Per studi e team in crescita', featured: true },
  { name: 'Agency', description: 'Tutto lo spazio per il tuo prossimo passo.', monthly: 99, yearly: 79, projects: '50 progetti attivi', environments: '10 ambienti per progetto', audience: 'Per agenzie con più progetti', featured: false },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  return <>
    <div className={styles.billingToggle} role="group" aria-label="Periodicità del listino proposto"><button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Mensile</button><button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Annuale <span>−20% circa</span></button></div>
    <div className={styles.plans}>{plans.map((plan, index) => <article key={plan.name} data-reveal data-reveal-delay={index * 90} data-spotlight className={`${styles.plan} ${plan.featured ? styles.featuredPlan : ''}`}>
      {plan.featured ? <span className={styles.planBadge}>PER CHI LAVORA IN TEAM</span> : null}
      <p className={styles.planAudience}>{plan.audience}</p><h3>{plan.name}</h3><p className={styles.planDescription}>{plan.description}</p>
      <div className={styles.price} aria-live="polite"><strong key={annual ? 'annual' : 'monthly'}>{annual ? plan.yearly : plan.monthly}<span>€</span></strong><span>/ mese</span></div>
      <p className={styles.billingNote}>{annual ? `${plan.yearly * 12} € all’anno, IVA esclusa` : 'Fatturazione mensile proposta, IVA esclusa'}</p>
      <Link href={dashboardLoginUrl} className={`${buttonVariants({ variant: plan.featured ? 'default' : 'outline' })} ${styles.planCta}`}>Esplora Reporty <ArrowRight aria-hidden="true" /></Link>
      <ul>{[plan.projects, plan.environments, 'Revisori ospiti illimitati', 'Pin, screenshot e allegati', 'Estensione e widget', 'Stati, priorità e conversazioni'].map(feature => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
    </article>)}</div>
    <p className={styles.pricingDisclaimer}>Listino proposto: abbonamenti e limiti dei piani non ancora attivi.<br />I pulsanti aprono la dashboard e non avviano un acquisto.</p>
  </>;
}
