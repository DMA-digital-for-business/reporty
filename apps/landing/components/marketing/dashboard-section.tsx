import Link from 'next/link';
import { ArrowRight, Check, CircleDot, Layers3, List, MessageSquare, Search } from 'lucide-react';
import { BrandLogo } from '@reporty/shared/ui/brand-logo';
import { buttonVariants } from '@reporty/shared/ui/button';
import { dashboardLoginUrl } from '@/lib/links';
import styles from './landing.module.css';
import dashboard from './dashboard-section.module.css';

const columns = [
  { key: 'open', label: 'Aperta', reports: [
    { body: 'Il titolo va a capo su mobile', priority: 'Alta', path: '/contatti', environment: 'Produzione', replies: 2 },
    { body: 'Aggiungere spazio sotto il logo', priority: 'Media', path: '/', environment: 'Staging', replies: 0 },
  ] },
  { key: 'in_progress', label: 'In lavorazione', reports: [
    { body: 'Allineare il pulsante del form', priority: 'Alta', path: '/contatti', environment: 'Staging', replies: 3 },
  ] },
  { key: 'validation', label: 'Validazione', reports: [
    { body: 'Verificare il contrasto del menu', priority: 'Media', path: '/', environment: 'Staging', replies: 1 },
  ] },
  { key: 'resolved', label: 'Risolta', reports: [
    { body: 'Corretto il link nel footer', priority: 'Bassa', path: '/', environment: 'Produzione', replies: 2 },
  ] },
];

export function DashboardSection() {
  return <section id="dashboard" className={`${styles.section} ${dashboard.section}`} aria-labelledby="dashboard-title">
    <div className={styles.container}>
      <div className={dashboard.heading} data-reveal>
        <div><p className={styles.kicker}>DALLA PAGINA ALLA VISIONE D’INSIEME</p><h2 id="dashboard-title">Tutti i feedback.<br />Una direzione chiara.</h2></div>
        <div><p>Raccogliere una segnalazione è solo l’inizio. Nella dashboard organizzi il lavoro, ritrovi il contesto e segui ogni fix fino alla validazione.</p><Link href={dashboardLoginUrl} className={`${buttonVariants({ variant: 'link' })} ${dashboard.cta}`}>Apri la dashboard <ArrowRight aria-hidden="true" /></Link></div>
      </div>
      <figure className={dashboard.figure} data-reveal>
        <figcaption>ANTEPRIMA ILLUSTRATIVA DELLA DASHBOARD <span>Dati di esempio</span></figcaption>
        <div className={dashboard.viewport} role="region" tabIndex={0} aria-label="Anteprima dashboard in vista Kanban. Scorri orizzontalmente per vedere tutte le colonne.">
          <div className={dashboard.app}>
            <aside className={dashboard.sidebar} aria-label="Progetti nell’anteprima"><BrandLogo className={dashboard.logo} /><span className={dashboard.projectSearch}><Search size={12} aria-hidden="true" />Cerca progetto</span><span className={dashboard.sidebarLabel}>PROGETTI</span><div className={dashboard.projectActive}><span />Sito vetrina</div><div className={dashboard.project}><span />E-commerce</div><div className={dashboard.project}><span />Area clienti</div><span className={dashboard.team}>Il tuo team, nello stesso spazio.</span></aside>
            <div className={dashboard.workspace}>
              <div className={dashboard.topbar}><span><strong>Sito vetrina</strong><span>Segnalazioni <i>5</i></span><span>Ambienti <i>2</i></span></span><span className={dashboard.viewBadge}>Vista Kanban</span></div>
              <div className={dashboard.filters}><span className={dashboard.reportSearch}><Search size={12} aria-hidden="true" />Cerca nelle segnalazioni…</span><span>Stato <i>4</i></span><span>Priorità</span><span>Ambiente</span></div>
              <div className={dashboard.board}>{columns.map(column => <div className={dashboard.column} key={column.key} data-status={column.key}><div className={dashboard.columnTitle}><span /><strong>{column.label}</strong><i>{column.reports.length}</i></div>{column.reports.map(report => <article className={dashboard.report} key={report.body}><p>{report.body}</p><span className={dashboard.priority} data-priority={report.priority}><CircleDot size={9} aria-hidden="true" />{report.priority}</span><span className={dashboard.reportContext}>{report.environment}<span>{report.path}</span></span><div className={dashboard.reportFooter}><span>Revisore ospite</span><span><MessageSquare size={10} aria-hidden="true" />{report.replies}</span></div></article>)}</div>)}</div>
            </div>
          </div>
        </div>
        <p className={dashboard.mobileHint}>Scorri l’anteprima per esplorare tutte le colonne →</p>
      </figure>
      <div className={dashboard.benefits}>
        <article data-reveal><div><List size={20} aria-hidden="true" /><h3>Il lavoro, come lo vedi tu.</h3></div><p>Passa da Lista a Kanban per consultare i dettagli o seguire l’avanzamento delle segnalazioni.</p></article>
        <article data-reveal data-reveal-delay="90"><div><Search size={20} aria-hidden="true" /><h3>Trova quello che conta.</h3></div><p>Ricerca e filtri su stato, priorità e ambiente ti aiutano a concentrarti sulle prossime modifiche.</p></article>
        <article data-reveal data-reveal-delay="180"><div><Layers3 size={20} aria-hidden="true" /><h3>Dal progetto al singolo fix.</h3></div><p>Organizza progetti e ambienti. Apri una segnalazione per ritrovare screenshot, allegati e conversazioni.</p></article>
      </div>
      <p className={dashboard.closing}><Check size={14} aria-hidden="true" />Aperta, in lavorazione, validazione, risolta. Il percorso è visibile a tutto il team.</p>
    </div>
  </section>;
}
