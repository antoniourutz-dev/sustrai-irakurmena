# MINTZAKATS → SUSTRAI · Integrazio-pilotua (2026-11-22)

## Iturriaren auditoretza
- Jatorria: `https://github.com/antoniourutz-dev/mintzakats`, `main`.
- Jatorrizko 7 eguneko algoritmoko hazi deterministak eta bi pasako nahasketa erabiltzen ditu `jokoak/mintzakats/core.js` fitxategiak.
- Supabase Lexikoa: `public.euskera_questions` — 141 galdera, 141 egitura baliodun, `id` 0 barne; eguneko 20 galdera eta asteko 140 galdera errepikatu gabe.
- Eguneko gramatika: `grammar_daily_schedule` aktiboa bada `grammar_lessons` argitaratuaren erlazioa; gaur egun programaturiko errenkadarik ez badago, 12 ikasgai argitaratuen artean hautapen determinista.
- Zuzentasunaren epai teknikoa galdera-bankuko `answer` gakoan oinarritzen da, ez beste arau-iturri independente batean. Ez da auditoria akademiko egiaztatutzat aurkezten.
- Jatorrizko MINTZAKATSek galdera guztiak B2 gisa etiketatzen zituen; integrazio honetan **ez dugu maila hori egiaztatutzat hartzen**, horretarako metadaturik ez dagoelako.
- Jatorrizko azalpen automatikoek aukerak beti «forma zuzen/oker» gisa izendatzen zituzten, analisi independentea egin gabe. Horiek ez dira kopiatu, irizpide pedagogiko egiaztatu gabeak ez emateko.

## Funtzioak
- `/jokoak/mintzakats/`: eguneko partida bakarra (20 galdera), zazpi eguneko zikloa; ikasle guztientzat ordena bera egun berean.
- Erantzunak, galdera-IDak, saio hasia, puntuazioa, iraupena eta hutsak `sustrai-jokoak-mintzakats-v1` giltza pribatuan gordetzen dira.
- Galdera zuzena = 40 puntu + 0–10 abiaduraren araberako puntu, jatorrizko formula bera; okerra = 0 puntu.
- Bukatutako eguna ezin da puntuaziorako berriz egin; hutsen bigarren saiakera ez da puntuaziora gehitzen.
- Bolada eta XP pertsonalak: benetan amaitutako egunen gainean bakarrik; ez dira maila ofizialaren adierazle.
- Gonbidatuaren biltegiratzea lokala da, eta erabiltzaile aktiboaren emaitzak `sr_app_state` taulan bere `auth.uid()` identitatearen pean gordetzen dira.
- Ez da MINTZAKATSen login bereizia behar, ezta `@mintzakats.app` helbide faltsurik edo textuzko `player_id` sortu ere.

## Segurtasun-muga (nahitaezkoa)
Live RLS ikuskatuta:
- `public.partidak` — `FOR ALL TO anon,authenticated USING(true) WITH CHECK(true)`.
- `public.jokalari_egoera` — politika bera.
- Sistema horretan ikasle baten izenean emaitzak alda litezke. **Ez erabili sailkapen publikoa edo irakasleen erabiltzaile-kudeaketa** RLS garbitu eta zerbitzariko puntuazio-egiaztapena izan arte.
- Integrazio honek ez du bi taula horietan SELECT/INSERT/UPDATE/DELETE egiten; ez du haien RLS, eskema edo historiarik aldatzen.
- Antzinako 185 partida eta 9 jokalariren informazioa bere horretan mantentzen da, baina ez da atxiki SUSTRAIren ikasleen identitateei automatikoki.

## Argitalpen aurreko ateak
1. `node --test tests/jokoak-mintzakats.test.cjs` eta JS sintaxi-testak.
2. 7 egun × 20 galdera: egun bakoitzaren determinismoa, aste bereko errepikapenik eza.
3. Benetako Supabase bankuarekin gonbidatua eta kontua; kontu arteko datuen isolamendua.
4. Partida hasia gordetzea, berrirekitzea, amaiera bakarra, hutsen berrikuspena, egun berriaren biraketa eta Europako/Madrilgo data.
5. `grammar_lessons.status='published'` baino ez erakustea.
6. Mugikorreko UI, teklatuko fokua, SR/aria-live eta PWA cachea probatzea.
7. Irakasleak galderen eta gramatikaren edukiak banan-banan auditatu aurretik, ez markatu materiala egiaztatutzat.

**Egoera:** teknika pilotuan, ez dago produkzioan; aldaketa `main` adarrera ez batu QA osorik egiaztatu gabe.
