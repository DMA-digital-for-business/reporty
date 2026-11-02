import type { Metadata } from 'next';
import Link from 'next/link';
import { dashboardLoginUrl } from '@/lib/links';
import { ArrowDown, ArrowRight, Check, CheckCheck, Globe, Code2, Layers3, Link2, MessageSquare, Monitor, MousePointer2, Paperclip, ShieldCheck, Smartphone, Terminal, Tablet } from 'lucide-react';
import { BrandLogo } from '@reporty/shared/ui/brand-logo';
import { buttonVariants } from '@reporty/shared/ui/button';
import { Pricing, ProductDemo } from '@/components/marketing/landing-interactions';
import styles from '@/components/marketing/landing.module.css';
import { LandingMotion } from '@/components/marketing/landing-motion';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { DashboardSection } from '@/components/marketing/dashboard-section';

export const metadata: Metadata = {
  title: 'Reporty — Il feedback, nel punto giusto.',
  description: 'Raccogli feedback direttamente sui tuoi siti web. Pin, screenshot e conversazioni in un unico posto, dal primo commento alla validazione.',
  openGraph: {
    title: 'Reporty — Il feedback, nel punto giusto.',
    description: 'Meno messaggi da interpretare. Più siti da consegnare. Scopri il feedback visivo di Reporty.',
    locale: 'it_IT',
    type: 'website',
  },
};

const features = [
  { icon: MousePointer2, title: 'Indica. Non spiegare.', text: 'Collega la segnalazione a un elemento della pagina o lascia un pin libero. Il team vede subito dove intervenire.' },
  { icon: MessageSquare, title: 'Una conversazione, tutto il contesto.', text: 'Descrizione, screenshot, allegati e risposte rimangono insieme. Anche quando la chat del progetto va avanti.' },
  { icon: Layers3, title: 'Ogni ambiente al suo posto.', text: 'Produzione, staging e localhost: organizza le segnalazioni per ambiente e pagina, senza confondere le revisioni.' },
];
const faqs: [string, string][] = [
  ['I miei clienti devono creare un account?', 'No. Condividi il link ospite dell’ambiente: i revisori possono consultare le segnalazioni senza registrarsi. Il nome viene richiesto solo alla prima segnalazione, risposta o modifica.'],
  ['Devo installare qualcosa sul sito?', 'Puoi usare l’estensione per Chrome o Edge desktop senza modificare il sito. Se preferisci il widget, aggiungi lo script e abilitalo nell’ambiente: il pannello di revisione sarà disponibile direttamente sulla pagina.'],
  ['Funziona anche su staging e localhost?', 'Sì. Ogni progetto può contenere ambienti con origini esplicite, inclusi staging e localhost. Protocollo e porta fanno parte dell’origine e le segnalazioni restano associate al proprio ambiente.'],
  ['Come vengono acquisiti gli screenshot?', 'Puoi aggiungere screenshot alle segnalazioni. Nel widget, la prima cattura richiede il consenso alla condivisione della scheda. Gli screenshot vengono conservati in un archivio privato e consultati tramite link temporanei.'],
  ['Posso già acquistare uno dei piani?', 'Il listino è una proposta commerciale. Pagamenti, abbonamenti e limiti dei piani non sono ancora attivi. Puoi accedere alla dashboard per esplorare Reporty; non viene avviato alcun acquisto.'],
];

export default function Home() {
  return (
    <LandingMotion className={styles.landing}>
      <a className={styles.skipLink} href="#contenuto">Vai al contenuto</a>
      <header className={styles.header}><div className={styles.nav}>
        <Link href="/" aria-label="Reporty, home"><BrandLogo className={styles.logo} /></Link>
        <nav aria-label="Navigazione principale" className={styles.navLinks}><a href="#come-funziona">Come funziona</a><a href="#dashboard" className={styles.dashboardNavLink}>Dashboard</a><a href="#funzionalita">Funzionalità</a><a href="#prezzi">Prezzi</a></nav>
        <Link href={dashboardLoginUrl} className={`${buttonVariants({ variant: 'outline' })} ${styles.navCta}`}>Accedi <ArrowRight aria-hidden="true" /></Link>
      </div></header>
      <main id="contenuto">
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroAtmosphere} aria-hidden="true"><span /><span /></div>
          <div className={styles.eyebrow}><span /> DAL “QUI C’È QUALCOSA” AL “FATTO”.</div>
          <h1 id="hero-title"><span className={styles.heroLine}>Il feedback,</span><span className={styles.heroLine}>nel <span className={styles.marked}>punto giusto.<svg viewBox="0 0 610 24" preserveAspectRatio="none" aria-hidden="true"><path d="M4 17 Q260 -3 605 12" /></svg></span></span></h1>
          <p className={styles.heroText}>Il tuo cliente vede un problema. Lo indica sul sito.<br className={styles.desktopBreak} /> Il tuo team sa cosa fare. Benvenuto in Reporty.</p>
          <div className={styles.heroActions}><Link href={dashboardLoginUrl} className={`${buttonVariants()} ${styles.primaryCta}`}>Entra in Reporty <ArrowRight aria-hidden="true" /></Link><a href="#demo" className={styles.textCta}>Guardalo in azione <ArrowDown size={16} aria-hidden="true" /></a></div>
          <div className={styles.heroNotes}><span><Check size={14} aria-hidden="true" /> Clienti senza account</span><span><Check size={14} aria-hidden="true" /> Estensione o widget</span><span><Check size={14} aria-hidden="true" /> Tutto il contesto, insieme</span></div>
          <ProductDemo />
          <div className={styles.audience}><span>PENSATO PER CHI COSTRUISCE IL WEB</span><div><span>Freelance</span><i /><span>Studi di design</span><i /><span>Agenzie web</span><i /><span>Team di sviluppo</span></div></div>
        </section>
        <section id="come-funziona" className={`${styles.workflow} ${styles.section}`} aria-labelledby="workflow-title"><div className={styles.container}>
          <div className={styles.sectionHeading} data-reveal><p className={styles.kicker}>MENO AVANTI E INDIETRO</p><h2 id="workflow-title">Le revisioni non dovrebbero<br />essere un secondo lavoro.</h2><p>Basta screenshot persi nelle chat e “il pulsante un po’ più a destra”.<br />Porta la conversazione esattamente dove serve.</p></div>
          <div className={styles.steps}>
            <article data-reveal><span className={styles.stepNumber}>01</span><Link2 aria-hidden="true" /><h3>Condividi il sito.</h3><p>Crea un ambiente e passa il suo link ospite. Il cliente entra nella revisione senza creare un account.</p></article>
            <article data-reveal data-reveal-delay="90"><span className={styles.stepNumber}>02</span><MousePointer2 aria-hidden="true" /><h3>Raccogli il punto.</h3><p>Un clic sulla pagina, una descrizione e gli screenshot che servono. Ogni segnalazione ha il suo contesto.</p></article>
            <article data-reveal data-reveal-delay="180"><span className={styles.stepNumber}>03</span><CheckCheck aria-hidden="true" /><h3>Arrivate al “fatto”.</h3><p>Definisci le priorità, rispondi e segui il lavoro: aperta, in lavorazione, validazione, risolta.</p></article>
          </div>
        </div></section>
        <DashboardSection />
        <section id="funzionalita" className={`${styles.container} ${styles.section}`} aria-labelledby="features-title">
          <div className={styles.featureIntro} data-reveal><div><p className={styles.kicker}>DAL PRIMO PIN ALL’ULTIMO FIX</p><h2 id="features-title">Meno interpretazioni.<br />Più collaborazione.</h2></div><p>Il feedback resta sulla pagina.<br />Il lavoro prende la direzione giusta.</p></div>
          <div className={styles.features}>{features.map(({ icon: Icon, title, text }, index) => <article key={title} data-reveal data-reveal-delay={index * 90}><div className={styles.featureIcon}><Icon size={23} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
          <div className={styles.advancedFeatures}>
            <article data-reveal data-spotlight data-tilt className={styles.advancedCard} aria-labelledby="mcp-title">
              <div className={styles.advancedLabel}><Terminal size={17} aria-hidden="true" /> MCP · PER LO SVILUPPO</div>
              <h3 id="mcp-title">Porta il contesto<br />al tuo agente AI.</h3>
              <p>Collega Reporty al tuo client MCP, come Codex. L’agente può leggere le segnalazioni e consultare risposte, screenshot e allegati per aiutarti a preparare il fix.</p>
              <div className={styles.mcpPreview} aria-label="Esempio del flusso di lettura MCP">
                <div><span className={styles.previewDot} /> REPORTY MCP <span>SOLA LETTURA</span></div>
                <ol><li><code>list_reports</code><span>Trova la segnalazione</span></li><li><code>get_report</code><span>Leggi il contesto</span></li><li><code>get_report_screenshot</code><span>Osserva il problema</span></li></ol>
              </div>
              <ul className={styles.advancedBenefits}><li><Check size={15} aria-hidden="true" /> Un progetto per collegamento autorizzato</li><li><Check size={15} aria-hidden="true" /> Accesso in sola lettura, revocabile dalla dashboard</li></ul>
            </article>
            <article data-reveal data-reveal-delay="100" data-spotlight data-tilt className={`${styles.advancedCard} ${styles.playgroundCard}`} aria-labelledby="playground-title">
              <div className={styles.advancedLabel}><Monitor size={17} aria-hidden="true" /> PLAYGROUND · PER LA REVISIONE</div>
              <h3 id="playground-title">Il sito e i feedback.<br />Nello stesso spazio.</h3>
              <p>Apri il tuo ambiente nella dashboard desktop. Esplora le pagine, affianca le segnalazioni al sito e verifica il risultato con viewport Desktop, Tablet e Mobile.</p>
              <div className={styles.playgroundPreview} aria-label="Schema del Playground: pagina con pin e segnalazioni affiancate">
                <div className={styles.playgroundPreviewBar}><span>Playground</span><span><Monitor size={13} aria-hidden="true" /><Tablet size={12} aria-hidden="true" /><Smartphone size={11} aria-hidden="true" /></span></div>
                <div className={styles.playgroundPreviewBody}><div className={styles.previewPage}><span /><span /><span /><i>1</i></div><div className={styles.previewSidebar}><strong>Segnalazioni</strong><span><i />Aperta</span><span><i />In lavorazione</span><span><i />Validazione</span></div></div>
              </div>
              <ul className={styles.advancedBenefits}><li><Check size={15} aria-hidden="true" /> Dimensioni personalizzate e pagine in tab</li><li><Check size={15} aria-hidden="true" /> Dettagli, risposte e gestione del feedback a fianco del sito</li></ul>
              <p className={styles.advancedNote}>Il sito deve consentire l’incorporamento. Pin e scorrimento alla segnalazione richiedono il widget attivo.</p>
            </article>
          </div>
          <div className={styles.toolStrip}><div><Globe aria-hidden="true" /><span>Chrome & Edge</span></div><div><Code2 aria-hidden="true" /><span>Widget sul tuo sito</span></div><div><Paperclip aria-hidden="true" /><span>Screenshot e allegati</span></div><div><ShieldCheck aria-hidden="true" /><span>Screenshot privati</span></div></div>
        </section>
        <section id="prezzi" className={`${styles.pricingSection} ${styles.section}`} aria-labelledby="pricing-title"><div className={styles.container}><div className={styles.sectionHeading} data-reveal><p className={styles.kicker}>UN PIANO PER OGNI MODO DI LAVORARE</p><h2 id="pricing-title">Piccoli fix.<br />Grandi cose, insieme.</h2><p>Una proposta di prezzo che cresce con i tuoi progetti.<br />I revisori ospiti sono inclusi in ogni piano.</p></div><Pricing /></div></section>
        <section id="faq" className={`${styles.container} ${styles.faqSection} ${styles.section}`} aria-labelledby="faq-title"><div data-reveal><p className={styles.kicker}>TUTTO CHIARO?</p><h2 id="faq-title">Buone domande.<br />Risposte semplici.</h2></div><FaqAccordion items={faqs} /></section>
        <section className={styles.finalCta}><div className={styles.container} data-reveal><span className={styles.finalPin}><MousePointer2 size={30} aria-hidden="true" /></span><p className={styles.kicker}>IL PROSSIMO FEEDBACK? METTILO QUI.</p><h2>Fai spazio al lavoro fatto bene.</h2><p>Un sito, un team, un posto per capirsi.</p><Link href={dashboardLoginUrl} className={`${buttonVariants()} ${styles.primaryCta}`}>Apri Reporty <ArrowRight aria-hidden="true" /></Link></div></section>
      </main>
      <footer className={`${styles.container} ${styles.footer}`}><Link href="/" aria-label="Reporty, home"><BrandLogo className={styles.logo} /></Link><p>Il feedback, nel punto giusto.</p><nav aria-label="Navigazione footer"><a href="#prezzi">Prezzi</a><a href="#faq">FAQ</a><Link href={dashboardLoginUrl}>Accedi alla dashboard <ArrowRight size={14} aria-hidden="true" /></Link></nav><span>© {new Date().getFullYear()} Reporty</span></footer>
    </LandingMotion>
  );
}
