# SUSTRAI · ZINOK jokoaren integrazioa (2026-11-22)

## Jatorria eta irismena
- GitHub: `antoniourutz-dev/zinok` (main) → `antoniourutz-dev/sustrai-irakurmena` (`feat/jokoak-teusk-pilot-20261122`).
- Jatorrizko ZINOKek `SYNONYM_DATA` (607 talde, B1/B2/C1/C2/EX/MA etiketak) kodean zeukan; Supabase Lexikoako `synonimoak_2` (1.243 sarrera, 1–4 multzo) ez da etiketa-matrize beraren baliokidea. Ez dira mapatu maila ofizialetara.
- Sinonimo-jokoa 10 galderakoa; `synonimoak_2` irakurri eta zuzeneko gakoarekin hiru distraktore sortzen dira. Gakoak eskuragarri daude frontend-ean, entrenamendua delako, ez azterketa ziurtatua.
- Mezu Zuzentzailea: jatorrizko `src/services/puzzleService.ts` fitxategitik **35** pilotu-ariketa hartu dira, IDak gordez. Ez dago 66–100ko errepikapen automatikoen eta egiaztatu gabeko 51–65 ariketen kopiarik.
- Bilatzailea: `synonimoak_2` taulako `hitza` eremuaren hasierako bat-etortzeak; gehienez 30 sarrera bilaketako.
- Ez dago SQL idazketarik, migratzerik, politika edo baimen-aldaketarik. ZINOKen datu zaharrak ez dira ezabatu edo gainidatzi.

## Kontuak, segurtasuna eta jarraipena
- `window.SustraiCloud` saio bakarra; ZINOKen login bereizirik ez.
- `synonimoak_2` taulan `anon` erabiltzaileak ez du SELECT pribilegiorik; horregatik **saioa hasi behar da** sinonimo-jokoa eta bilatzailea erabiltzeko.
- Mezu Zuzentzailearen 35 testuak aldez aurretik programatutakoak direnez, gonbidatuek ere erabil ditzakete.
- Amaitutako saioen laburpenak `sustrai-jokoak-zinok-v1` giltzan, `SustraiCloud.storage` eta `flush` erabiliz. Ezin da sartu beste ikasle baten erregistroan RLSren arabera.
- Ez dago oraindik MINTZAKATSen taula publikoen RLS arazoaren konponketarik. Ez nahastu jolas hau haren sailkapenarekin.

## Edukiaren egoera
- `sinonimoak` array baten presentziak ez du sinonimo guztiak testuinguru guztietan trukagarriak direla frogatzen.
- `active=true` ez da hizkuntza-auditoriaren froga. Galdera batzuetako distraktoreak anbiguoak izan daitezke; `jokoaren gakoa` egiaztapenerako proposamena da.
- Jatorrizko Mezu Zuzentzailearen beste ariketa batzuek errata, aldaketa morfologiko edo esanahi-ñabardura desegokiak zituztela ikusi da; horregatik azpimultzoa egin da, ez `egiaztatua` zigilua eman.
- ZINOKen 35 itemak **berrikusteko** daude, eta ez da puntuazio ofizialik eskaintzen.

## Probak
1. `node --test tests/jokoak-zinok.test.cjs`, `node --check jokoak/zinok/app.js`, `node --check jokoak/zinok/core.js` eta `node --check jokoak/zinok/puzzles.js`.
2. Gonbidatuak: menu + Mezu Zuzentzailea funtzionatzen dute, baina Supabase sinonimoen jokoak saioa eskatzen du.
3. Sartutako ikasleak: 1–4 sortetako 10 galdera, erantzun berde/gorriak, laburpena eta bilaketa.
4. Puzzle: 35 itemetako 7 multzoak; esaldiko hitz klikatzea, erantzuna ematea, okerra/zuzenaren azalpena eta taldearen laburpena.
5. Sare-konexiorik ez badago: argi adierazten da errorea, eta berriro saiatzeko botoia dago.
6. Mugikor eta teklatuko QA, PWAren cachea, beste erabiltzaile baten aurrerapena ezin ikustea, login/logout eta kontu bakoitzaren sinkronizazioa.
7. Irakaslearen auditoria akademikoa, erabilera-aldaeren egiaztapena eta gaitasun-transferentzia osatu aurretik, ez argitaratu eredu egiaztatu edo ofizial gisa.

**Egoera**: integrazio-pilotu teknikoa; QA akademikoa eta nabigatzaile bidezkoa egiteke.
