# Reporty — sito vetrina

App Next.js indipendente dalla dashboard `apps/web`. Non aggiungere dipendenze Supabase, autenticazione o API della dashboard alla landing. La demo riusa il pannello reale di widget/estensione, compilato da `scripts/build-landing-demo.mjs`, con trasporto esclusivamente locale. Non caricare il bootstrap remoto del widget.

Prima di modificare Next.js leggere la documentazione pertinente in `node_modules/next/dist/docs/` (anche risolta da `../web/node_modules/next/dist/docs/` se npm condivide la dipendenza).

Gli accessi puntano all’origine `NEXT_PUBLIC_DASHBOARD_URL`, con fallback alla dashboard di produzione. I prezzi sono proposti: non implementano pagamenti o limiti dei piani.

Distribuire come progetto Vercel separato, Root Directory `apps/landing`, con accesso ai file esterni alla root per `packages/shared`.
