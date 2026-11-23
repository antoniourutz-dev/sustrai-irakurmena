# SUSTRAI · Gurutzegramen sortzailea · 2026-11-23

## Helburua eta kokalekua

`/admin/gurutzegramak/` administratzaileentzako material-diseinu tresna da. Ez du ikasleen `/jokoak/gurutzegramak/` eguneroko jokoa ordezkatzen, eta ez du `smx_crossword_daily` aldatzen.

### Datuen jatorria (bikoiztu gabe)

- **Oposik** Supabase proiektua (`gmwgwttwzkgyljevddul`): `osasun_entries` (argitaratutako sarrerak soilik), `osasun_specialties`, `osasun_entry_specialties` (`suggested` loturak).
- Espezialitate, azpiarlo eta kategoria orokorren aukeraketa, jatorrizko kodeak gordez.
- `published` ez da beti adituek baliozkotutako edukiaren sinonimoa; `editorial_state` ikusgai dago, eta irakaslearen berrikuspena behar da.
- Pista bakoitzaren jatorria `Oposik · osasun_entries · <kodea>` bezala gordetzen da; ez da definiziorik asmatzen.

### Segurtasuna

- Orrialdeak `sr_is_admin()` RPC bidez egiaztatzen du baimena katalogoa ireki baino lehen.
- Lexikoako `smx_crossword_authoring` taulak RLS du: anon rolak ez du sarbiderik; `authenticated` rolak administratzaile izatea eskatzen du; administratzaileek beren fitxak alda ditzakete.
- Oposikeko publishable key publikoa da, eta irakurketa RLS bidez `published` egoerara mugatuta dago. Ez dago sekreturik bezeroan.
- `smx_crossword_authoring` taula `smx_crossword_daily`-tik bereizia da; `draft` eta `reviewed` egoerak ez dira argitalpen automatikoak.

### Ezaugarriak

1. Gai orokorrak, espezialitateak eta azpiarloak hautatu.
2. 8, 10, 12 edo 15 hitz aukeratu, zailtasuna eta izenburua ezarri; esamoldeak aukeran.
3. Pista eta erantzun baliodunak soilik erabili: 4–14 letra, azalpena ez hutsik, erantzuna ez pistaren barruan, errepikapenik ez.
4. Hitz bakoitza beste batekin konektatutako taulan kokatu. Huts egiten badu, errore esplizitua eman; ez sortu gurutzegrama faltsu/deskonektaturik.
5. Taulan erantzunak probatu, egiaztatu, pistak editatu eta banakako terminoak baztertuz sortu.
6. Ikaslearen eta irakaslearen Word editagarria eta PDFa deskargatu. Irakaslearen bertsioan erantzunak agertzen dira; ikaslearenean ez.
7. Bertsioak administratzailearen liburutegian gorde, ireki eta editatu.

### Kalitate-probak

- `node --test tests/crossword-studio.test.cjs`
- Probatu Oposikeko benetako `published` laginekin, bereziki kardio-, erizaintza- eta farmazia-arloetan.
- Egiaztatu saio autentifikatu gabea eta ikasle arrunta ezin direla sartu; administratzaileak bakarrik ireki/edita dezakeela.
- Ikaslearen PDF eta Word fitxategietan erantzunik ez dagoela egiaztatu, baita programatikoki dokumentua aztertuta ere.
- PDF orri osoa eta Word taula erabat editagarria direla egiaztatu tamaina desberdinetan.
- Mugikorreko tamainak, fokua eta teklatu bidezko erabilera egiaztatu.
- Ezin izan da saio erreal baten nabigatzaileko E2E proba egiaztatu garapen automatikoan; ez batu produkziora berrikuspenik gabe.

### Muga ezagunak

- Hitz luzeegiak, tarteko marrak edo definizioan bertan ageri diren erantzunak baztertu egiten dira.
- Oposikeko espezialitate-loturak gaur egun `suggested` dira; ez irudikatu baliozkotutzat.
- Aurreikusitako hitz kopurua lortu ezin denean, gai orokorragoa edo kopuru txikiagoa aukeratu behar da.
- Zuzenketa da mekanikoa; ariketaren gaitasun-maila pedagogikoa eta definizioen egokitasuna irakasleak berrikusi behar ditu.
- Proiektuaren gaur egungo PDF esportatzaileak CSSko taularen irudi bat eskalatzen du. Inprimatze-proba egin behar da taula handiekin, kalitate profesionala baieztatu aurretik.
