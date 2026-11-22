# Gurutzegramak · 001 · Osasuna

**Egoera:** pilotu teknikoa · **Interfazea:** HitzBira / Jokoak · **Deialdia:** ez da azterketa ofiziala.

## Edukia eta jatorria
- 12 sarrera bakunak, Oposik Supabase proiektuko osasun_entries eta osasun_evidence bankuetan banan-banan egiaztatuak 2026-11-22an, ondoko kodeekin:
  OS-C013, OS-C023, OS-C014, OS-C020, OS-C055, OS-C081, OS-C060, OS-C019, OS-C001, OS-C015, OS-C003, OS-C058.
- 12 terminoek euskarazko definizioa, jatorrizko banakako ebidentzia-erregistroa eta editorial_state dokumentala dute; horrek **ez du** jokoa akademikoki baliozkotzen.
- Pistak eta azalpen pedagogikoak joko honetarako berridatzitako esaldi originalak dira; kanpoko lan baten testu osoa ez da kopiatu.
- «C1 · pilotua» orientazio didaktikoaren etiketa da, ez HEOC/HABE/IVAP maila-kalibrazioaren emaitza.
- Behin betiko argitalpena baino lehen, kanpoko bigarren berrikusle batek pistak, adierak, erantzun bakartasuna, alternatibak, naturaltasuna eta ortografia egiaztatu beharko ditu.

## Diseinua eta motorraren baldintzak
- Aurrez sortutako eta egiaztatutako **12×13** taula; **12 hitz** eta **13 gurutzaketa bateragarri**.
- Letra bana gelaxka bakoitzean; TX = bi gelaxka. Hitz bakunak bakarrik lehen pilotuan.
- Hitza hautatu gelaxkaren bidez edo pistaren bidez; erantzuna testu-eremuan idatzi. Enter sakatuta egiaztatzen da.
- Koloreez gain, ✓ / × eta azalpen testuala. Okerreko hitzaren hizki zuzenak berdez, okerrak gorriz.
- Pista bakoitzak hizki bat baino ez du argitzen. Erantzun zuzenak azalpen osagarria eta iturri-kodea erakusten ditu.
- Aurrerapena SustraiCloud.storage bidez gordetzen da; konturik gabeko saioa lokalean geratzen da.
- Ez dago erabiltzaile-datuen taula berririk, ezta datu-sarrera kliniko edo pertsonalik ere.

## Tokiko proba automatikoa

Exekutatu proiektuaren erroan: node jokoak/gurutzegramak/test-core.cjs

Probak: JS sintaxia, hitzen bakartasuna eta posizioa, 13 gurutzaketen letra-bateragarritasuna, sarearen konektibitatea, erantzun oker/zuzenaren feedbacka, pista, 12 hitzen amaiera eta berrabiaraztea.

## Benetako nabigatzaileko probak (egiteke)
- [ ] Mahaigaineko Chrome/Edge: taula, focus, sagua, teklatua, Enter eta errore-mezuak
- [ ] iOS Safari eta Android Chrome: 320 px-tik aurrerako pantailak, scroll horizontala, teklatu birtuala
- [ ] Gonbidatua eta kontuarekin: saioa gorde/berreskuratu gailuen artean, pribatutasuna
- [ ] PWA: cache bertsio berria, lineaz kanpoko hasiera eta eguneratzea
- [ ] Ikusgaitasuna: letra-tamainak, kontrastea, tekla bidezko nabigazioa eta pantaila-irakurgailua
- [ ] Akademikoa: bigarren berrikusle independenteak 12 pista eta 12 azalpenak ebaluatu

**Ez fusio automatikoa produkziora:** proba horiek eta edukien berrikuspena behar dira.

## 1.1 · Ikasteko modua eta Erronka modua (2026-11-22)
- **Hasierako pantaila**: Ikasteko modua eta Erronka modua. Moduak partida hastean finkatzen dira; ez dago entrenamendutik puntuazio lehiakorrera bihurtzerik.
- **Erronka**: 100 puntu zuzeneko hitzeko; 40 puntu letra berri baten pistagatik; 15 puntu erantzun oker *desberdinaren* egiaztapenagatik. Hitz guztiak osatuta, denbora-saria max(0, round(300 − segundoak/2)).
- **Ikasteko modua**: ez du puntuazio edo zigorrik; haren letraz letrako zuzenketa ez da erronka moduan agertzen.
- **Hutsegite berdinaren berriz egiaztatzeak** ez du beste 15 puntu kentzen, erantzuna aldatu ez bada.
- **Pistak**: lehenagotik ebatzitako gurutzaketek emandako letrak ez dira berriz kobratzen. Erakutsitako letra bakoitza posizio bakar gisa erregistratzen da; aurretik argitutako posizio bera ezin da pista berri gisa ordaindu.
- **Kronometroa**: hasiera-une absolututik amaiera-unera; orrialdetik irteteak ez du denbora geldiarazten. Berriz sartzean denbora erreala berreskuratzen da. Amaitutako saioetan denbora finkoa da.
- **Emaitza**: hitz zuzenak, segundoak, pistak, hutsegiteak, denbora-saria eta azken puntuazioa. Marka pertsonalik onena gordetzen da jokoaren bertsio honetarako.
- **Biltegiratzea**: saio berriak v2 gakoan gordetzen dira; v1 saio zaharrak *ikasteko moduan soilik* migratzen dira. Marka pertsonala bereizita gordetzen da. Parte hartzaileak berak ezabatu edo alda ditzake bezeroaren datuak.
- **Ez dago publikoaren sailkapenik**: bezeroan biltegiratutako denbora eta puntuazioa ez dira egokiak sailkapen fidagarri baterako. Horretarako, zerbitzariko erregistroa, bertsioaren sinadura, berdintasunezko baldintzak eta abusuaren aurkako proba gehiago beharko lirateke.
- **Urruneko fitxategia**: PRaren previewan bakarrik, ez produkzioan; lexikoaren berrikuspen akademiko eta nabigatzaile errealeko QA itxaron behar da.

### Berriz-probatzeko kasuak
- [x] Sarearen egitura (12 hitz, 13 gurutzaketa).
- [x] Bi moduen hasiera, okerrak, pistak, puntuazio-zigorrak, amaierako emaitza.
- [x] Emaitza berdin okerra bi aldiz egiaztatuta, kostu bikoitzik gabe.
- [x] Denbora luzez orrialdetik irten eta saioa berriro irekitzean, denbora metatzen da.
- [x] Marka pertsonala mantendu, partida berrabiarazi arren.
- [x] Bertsio zaharreko saioa soilik ikasteko modura migratu.
- [x] Gurutzaketa agerikoaren letra ez kobratu berriz eta testuaren posizioa mantendu.
- [ ] Benetako mahaigain/mugikor nabigatzaileko zuzenketa, fokua, pantaila-irakurgailua eta kontrastea.
- [ ] Hitz bakoitzaren pista eta azalpenaren bigarren berrikuspen akademikoa.

## 2.0 · Eguneko gurutzegramak (2026-11-22)

**Ezarrita:** bi modalitate bereizi eta data-mapa partekatua, HitzBira aplikazioaren barruan.

### Datuen kontratua
- **Taula:** public.smx_crossword_daily, Supabase Lexikoa.
- **Migrazioa:** supabase/migrations/20261122200826_smx_crossword_daily_catalog_v1.sql.
- **Gaurko datuak:** Europa/Madrid ordu-zonako 00:00tik. Play-date + level + mode konbinazio bakarra.
- **Lehen sorta:** 2026-11-22tik 2026-12-21era, 30 egun, egunean 2 taula, guztira **60 taula**. Taula bakoitzak **10 hitz** ditu. 59 termino dokumentaturen bildumatik hautatu eta gurutzatu dira.
- **Bi modalitateak:** egun berean ikasteko eta erronkako hitzak ez dira errepikatzen; gainerako egunetan errepikapen mailakatua onartzen da.
- **Kalitatea:** hitz bakoitzak jatorrizko Oposik kodea, pista berridatzia eta bankuko definizio argigarria daramatza. Mekanismoak gurutzaketa bateragarriak eta sare konektatua egiaztatzen ditu. **Egiaztapen linguistiko independentea egin gabe dago:** egoera pilot, berrikuspena pending, eta maila C1 orientazio didaktiko gisa soilik.
- **Gaia:** Osasun-hiztegia. Ez dira talde estuagoak iragartzen, batzuek ez dutelako hautatutako hamar hitzen gehiengoa osatzen.
- **Datu publikoak:** RLS bidez argitaratu edo pilotuan dagoen eta dagoeneko iritsi den eguneko taula soilik kontsulta daiteke; etorkizuneko soluzioak ezin dira anon/autentifikatu rolarekin irakurri. Datuak ez dira GitHubeko JSON fitxategi publikoan argitaratzen.
- **Egile-eredua:** authoring-generator.cjs; edukien iturria katalogo editorial kontrolatua, ez ikasleari IAz sortutako erantzun inprobisatuak.
- **Bezeroa:** data aukeratzen da Europe/Madrid erabiliz; bi taulak Supabasetik eskuratzen dira, eta gaurko cachea gordetzen da.
- **Errepikapena:** egun bereko saioa eta marka pertsonala berreskuratzen dira. Amaitutako saio batetik menura itzultzean, amaierako emaitza ez da ezabatzen.
- **Gauerdiko aldaketa:** partida ez badago martxan, eguna aldatzen denean berriz kargatzen da katalogoa; partida aktibo badago, aurrekoa amai daiteke eta hurrengo partida hastean egun berrikoa kargatzen da.
- **Egunen amaiera:** 2026-12-21etik aurrera ez dago taula berririk programatuta; sistemak ez du edukirik asmatzen, argi azaltzen du falta den materiala. Egutegia berriz hornitu behar da.

### Proba-egiaztapena
- [x] 60 taula/30 egun; data eta modalitate bakoitzeko 10 hitz; 688 gurutzaketa, hitzak konektatuak.
- [x] Gaurko bi taulen hitzak bereiziak (ez dago hitz errepikaturik modu bien artean egun berean).
- [x] Ez dago hitz osoa agerian uzten duen pistarik.
- [x] Anon rolarekin 2026-11-22an bi taula soilik ikusgai, beste 58 etorkizunekoak ez.
- [x] Test sintetikoko bi modu, akatsen/pisten kostua, kronometroa, berriz sartzea, marka, egun-aldaketa eta data hutsaren kudeaketa.
- [ ] Benetako nabigatzaileko E2E proba (Chrome/Firefox/Safari, desktop/mugikor, kontuarekin/anon).
- [ ] Bigarren berrikusle akademiko baten izenpetutako onespena.
- [ ] Programazioa luzatzea 2026-12-21etik haratago.

**Emaitza lehiakorrak ez dira zerbitzarian egiaztatzen:** marka pertsonalak dira, ez ikasleen arteko sailkapen publikoko emaitzak.

### Etorkizuneko edizioa
Egun gehiagorako taulak sortu/argitaratu aurretik:
1. Jatorrizko osasun_entries eta haien editorial_state egiaztatu.
2. Pista eta azalpen propioak berrikusi, definizioaren unibokotasuna egiaztatu, onargarriak diren aldaerak zerrendatu.
3. authoring-generator.cjs bidez taula sortu eta validate exekutatu.
4. Inportatu taula berria draft egoerara, egiaztatu data, maila eta modalitatearen bereizketa; berrikuspenaren erregistroa gorde.
5. Bakarrik behar den egunean eta baimenarekin jarri pilot edo, onespen independentea eginda, published.
