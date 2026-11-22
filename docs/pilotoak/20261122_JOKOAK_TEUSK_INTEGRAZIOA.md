# Jokoak · TEUSK integrazio-pilotua

- Jatorria: [antoniourutz-dev/teusk](https://github.com/antoniourutz-dev/teusk); TEUSKen galdera-hautaketa, sorta-mugak eta 10–50 galderako modua SUSTRAIren HTML/JS ingurunera egokitu dira. Jatorrizko React/Vite aplikazioa ez da ezabatu edo aldatu.
- Nabigazioa: `/jokoak/` → `/jokoak/teusk/`; ZINOK eta MINTZAKATS katalogoan **ez daude aktibo**.
- Datuak: Supabase Lexikoa, `public.atarikoa_questions` (irakurri bakarrik). Ez dago datu-migraziorik edo baimen-aldaketarik.
- Kontua: `window.SustraiCloud`, saio-hasieraren bikoizketarik gabe. Amaitutako saioen **laburpena soilik** `sustrai-jokoak-teusk-v1` giltzapean; gonbidatuaren kasuan gailuan, autentifikatutakoan `sr_app_state` sinkronizazioaren bidez.
- Kalifikazioa: hezigarria, ez ofiziala. Erantzunak klientera iristen dira `atarikoa_questions` taulatik; hau ez da azterketa segurua edo sailkapen lehiakor ziurtatua.
- Eduki-kalitatea: sortek zenbakizko ID tarteak erabiltzen dituzte, ez B2/C1/C2 egiaztatutako etiketak. Ez aurkeztu itemak auditatu gabe egiaztatutzat.
- Erabilgarritasuna: argi ikus daitezkeen zuzen/oker egoerak (kolorez eta testuz), galdera guztien berrikuspena eta mugikorrerako diseinua.
- Test estatikoak: `node --test tests/jokoak-teusk.test.cjs`; JavaScript sintaxia `node --check jokoak/teusk/app.js` eta `node --check jokoak/teusk/core.js`.

## Esku bidezko kalitate-probak argitaratu aurretik

1. Gonbidatua: katalogoa ireki, 4 sortak probatu eta saioa amaitu; emaitza gailuan bakarrik gorde.
2. Erabiltzaile autentifikatua: saio amaitua gorde, beste gailu batean kontu berean ikusi, ez ikusi beste ikasle baten daturik.
3. Galdera 0 sartzeko aukera; 5 eta 10–50 itemen moduak; erantzun guztiei zuzen/oker seinale testuala.
4. Supabaseko sare-errorea / datu hutsak / item desegokia: mezua eta berriz saiatzeko aukera, ez pantaila zuria.
5. Mugikorreko nabigazioa, teklatua, fokua, `aria-live`, tabbar, eta nabigatzailearen atzera botoia.
6. PWAren cache-bertsioa eta estekak; ez dago jolasaren galderarik offline gordeta.

## Argitaratzeko muga

Pilotua ez da automatikoki produkziora igoko. PRko previewan probatu behar da. ZINOK/MINTZAKATS integrazioak eta MINTZAKATSen RLS konponketa beste lan-fase batekoak dira.
