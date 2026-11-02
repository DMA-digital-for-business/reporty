'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import Script from 'next/script';
import { Plus } from 'lucide-react';
import { Button } from '@reporty/shared/ui/button';
import { useToastManager } from '@/components/ui/toast';
import styles from './landing.module.css';
import demo from './product-demo.module.css';

export function ProductDemo() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const toast = useToastManager();
  const reportError = useEffectEvent(() => { setFailed(true); toast.add({ title: 'Impossibile caricare la demo. Ricarica la pagina per riprovare.', type: 'error' }); });
  useEffect(() => {
    const loaded = () => { setReady(true); setFailed(false); };
    const error = () => reportError();
    window.addEventListener('reporty-demo:ready', loaded);
    window.addEventListener('reporty-demo:error', error);
    window.dispatchEvent(new Event('reporty-demo:mount'));
    return () => { window.removeEventListener('reporty-demo:ready', loaded); window.removeEventListener('reporty-demo:error', error); window.dispatchEvent(new Event('reporty-demo:dispose')); };
  }, []);
  return <>
    <section id="demo" className={`${styles.demoWrap} ${demo.invitation}`} data-reporty-demo-ui aria-labelledby="demo-title">
      <div className={demo.invitationCopy}><span className={styles.kicker}>LA DEMO È QUESTA PAGINA</span><h2 id="demo-title">Un clic sul punto.<br />E ci capiamo subito.</h2><p>Prova il pannello di Reporty usato da widget ed estensione: scegli un punto di questa landing, lascia il tuo feedback e ritrovalo subito dal pin.</p><Button className={styles.primaryCta} onClick={() => window.dispatchEvent(new Event('reporty-demo:create'))} disabled={!ready}><Plus aria-hidden="true" />Prova su questa pagina</Button><small>Le segnalazioni restano salvate in questo browser, anche dopo il ricaricamento. Screenshot e allegati sono disabilitati in questa demo locale.</small>{failed ? <p className={demo.loadError}>La demo non è disponibile. Ricarica la pagina per riprovare.</p> : null}
        <div className={demo.reset}>{resetConfirm ? <><p>Eliminare segnalazioni e risposte della demo salvate in questo browser?</p><Button size="sm" variant="destructive" onClick={() => { window.dispatchEvent(new Event('reporty-demo:reset')); setResetConfirm(false); }}>Elimina i dati della demo</Button><Button size="sm" variant="ghost" onClick={() => setResetConfirm(false)}>Annulla</Button></> : <button type="button" disabled={!ready} onClick={() => setResetConfirm(true)}>Azzera la demo locale</button>}</div>
      </div>
      <ol className={demo.guide}><li><span>1</span><div><strong>Premi +</strong><p>Scegli tra selezione di un elemento e pin libero.</p></div></li><li><span>2</span><div><strong>Indica il punto esatto</strong><p>Scrivi il feedback nel form di Reporty.</p></div></li><li><span>3</span><div><strong>Salva. È già aperta.</strong><p>Ritrova la segnalazione dal pin o dalla lista del pannello.</p></div></li></ol>
    </section>
    <Script src="/demo/panel.js" strategy="afterInteractive" onReady={() => { window.dispatchEvent(new Event('reporty-demo:mount')); }} onError={() => { window.dispatchEvent(new Event('reporty-demo:error')); }} />
  </>;
}
