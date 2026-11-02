'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dashboardLoginUrl } from '@/lib/links';
import { ArrowRight, Check, ChevronRight, CircleCheck, Globe, LockKeyhole, MessageSquare, MousePointer2 } from 'lucide-react';
import { buttonVariants } from '@reporty/shared/ui/button';
import styles from './landing.module.css';

const examples = [
  { title: 'Diamo più spazio al titolo?', text: 'Su questa sezione aumenterei il margine sotto il titolo. Così il progetto respira di più.', author: 'Giulia', initials: 'G', location: 'Titolo della pagina', status: 'Aperta', priority: 'Media' },
  { title: 'Questo pulsante si perde un po’.', text: 'Proviamo un colore più deciso per il link al progetto? Deve essere il prossimo passo naturale.', author: 'Marco', initials: 'M', location: 'Link al progetto', status: 'In lavorazione', priority: 'Alta' },
  { title: 'La nuova immagine funziona!', text: 'Ho controllato la nuova composizione. Per me questa modifica è pronta per andare online.', author: 'Giulia', initials: 'G', location: 'Immagine del progetto', status: 'Validazione', priority: 'Bassa' },
];

export function ProductDemo() {
  const [selected, setSelected] = useState(0);
  const report = examples[selected];
  return <div id="demo" className={styles.demoWrap}>
    <div className={styles.demoCaption}><span><span className={styles.liveDot} /> UNA REVISIONE, VISTA DA VICINO</span><span>Demo interattiva · Clicca sui pin</span></div>
    <div className={styles.browser}>
      <div className={styles.browserBar}><div className={styles.windowDots} aria-hidden="true"><i /><i /><i /></div><span className={styles.address}><LockKeyhole size={11} aria-hidden="true" /> studioforma.example / progetti</span><span className={styles.previewLabel}>SITO DI ESEMPIO</span></div>
      <div className={styles.demoContent}>
        <div className={styles.sampleSite}>
          <div className={styles.sampleNav}><strong>forma<span>®</span></strong><span>Studio indipendente di design <span aria-hidden="true">↗</span></span></div>
          <div className={styles.sampleLayout}>
            <div className={styles.sampleCopy}><span className={styles.sampleKicker}>IDEE CHIARE. FORME NUOVE.</span><h2>Le cose belle<br />nascono<br /><em>dal dialogo.</em></h2><p>Identità e spazi digitali per brand<br />che hanno qualcosa da dire.</p><span className={styles.sampleLink}>Esplora il progetto <ArrowRight size={15} aria-hidden="true" /></span></div>
            <div className={styles.artwork} aria-label="Illustrazione astratta di un arco arancione su fondo crema" role="img"><div className={styles.artworkCircle} /><div className={styles.artworkArch} /><span>FORMA<br />& SOSTANZA</span><small>STUDIO FORMA — 2026</small></div>
          </div>
          <div className={styles.sampleFooter}><span>BRAND STRATEGY & DIGITAL DESIGN</span><span>Milano, ovunque.</span></div>
          {examples.map((example, index) => <button key={example.title} type="button" className={`${styles.pin} ${styles[`pin${index}`]} ${selected === index ? styles.selectedPin : ''}`} aria-label={`Mostra segnalazione ${index + 1}: ${example.title}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>{index + 1}</button>)}
          <span className={styles.demoCursor} aria-hidden="true"><MousePointer2 size={22} fill="currentColor" /><span>Il tuo cliente</span></span>
        </div>
        <aside className={styles.reviewPanel} aria-label="Anteprima della segnalazione">
          <div className={styles.panelHeader}><span><span className={styles.tinyMark}>r</span> Reporty</span><span className={styles.panelCount}>3 segnalazioni</span></div>
          <div className={styles.panelBreadcrumb}><MessageSquare size={13} aria-hidden="true" /> Segnalazioni <ChevronRight size={12} aria-hidden="true" /> #{selected + 1}</div>
          <div className={styles.reportBody} aria-live="polite" aria-atomic="true"><span className={styles.elementLabel}><MousePointer2 size={12} aria-hidden="true" /> {report.location}</span><h3>{report.title}</h3><p>{report.text}</p><div className={styles.reportTags}><span>{report.status}</span><span data-priority={report.priority}>{report.priority}</span></div><div className={styles.reportAuthor}><span>{report.initials}</span><div><strong>{report.author}</strong><small>Revisore ospite · esempio</small></div></div></div>
          <div className={styles.panelBottom}><CircleCheck size={15} aria-hidden="true" /><span>Il contesto è già qui.<br /><strong>Puoi pensare al fix.</strong></span></div>
        </aside>
      </div>
    </div>
    <div className={styles.demoFootnote}><Globe size={14} aria-hidden="true" /> Sul tuo sito, nel suo contesto. Senza “quale pagina intendevi?”.</div>
  </div>;
}

const plans = [
  { name: 'Starter', description: 'Il tuo prossimo progetto, con le idee chiare.', monthly: 19, yearly: 15, projects: '3 progetti attivi', environments: '3 ambienti per progetto', audience: 'Per freelance e piccoli studi', featured: false },
  { name: 'Studio', description: 'Più clienti. Un unico flusso di revisione.', monthly: 49, yearly: 39, projects: '15 progetti attivi', environments: '5 ambienti per progetto', audience: 'Per studi e team in crescita', featured: true },
  { name: 'Agency', description: 'Tutto lo spazio per il tuo prossimo passo.', monthly: 99, yearly: 79, projects: '50 progetti attivi', environments: '10 ambienti per progetto', audience: 'Per agenzie con più progetti', featured: false },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  return <>
    <div className={styles.billingToggle} role="group" aria-label="Periodicità del listino proposto"><button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Mensile</button><button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Annuale <span>−20% circa</span></button></div>
    <div className={styles.plans}>{plans.map(plan => <article key={plan.name} className={`${styles.plan} ${plan.featured ? styles.featuredPlan : ''}`}>
      {plan.featured ? <span className={styles.planBadge}>PER CHI LAVORA IN TEAM</span> : null}
      <p className={styles.planAudience}>{plan.audience}</p><h3>{plan.name}</h3><p className={styles.planDescription}>{plan.description}</p>
      <div className={styles.price} aria-live="polite"><strong>{annual ? plan.yearly : plan.monthly}<span>€</span></strong><span>/ mese</span></div>
      <p className={styles.billingNote}>{annual ? `${plan.yearly * 12} € all’anno, IVA esclusa` : 'Fatturazione mensile proposta, IVA esclusa'}</p>
      <Link href={dashboardLoginUrl} className={`${buttonVariants({ variant: plan.featured ? 'default' : 'outline' })} ${styles.planCta}`}>Esplora Reporty <ArrowRight aria-hidden="true" /></Link>
      <ul>{[plan.projects, plan.environments, 'Revisori ospiti illimitati', 'Pin, screenshot e allegati', 'Estensione e widget', 'Stati, priorità e conversazioni'].map(feature => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
    </article>)}</div>
    <p className={styles.pricingDisclaimer}>Listino proposto: abbonamenti e limiti dei piani non ancora attivi.<br />I pulsanti aprono la dashboard e non avviano un acquisto.</p>
  </>;
}
