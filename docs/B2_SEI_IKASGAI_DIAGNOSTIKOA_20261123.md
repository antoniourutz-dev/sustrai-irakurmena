# SUSTRAI · B2ko sei ikasgai gidatuen osaketa eta hasierako diagnostikoa

**Data:** 2026-11-23  
**Aplikazio-bidea:** `/gramatika/ibilbidea/`  
**Egoera:** pilotu didaktikoa, `pilot_draft`; berrikuspen akademiko independentea falta da.

## Helburua

Gramatika-bankuko honako sei gaiak 4 urratseko ikasgai gidatu bihurtu:
1. `b2_aditzen_kasu_gobernua_nori_zertaz_norekin` — kasu-gobernua eta `lagundu`ren NOR/NORI alternantzia.
2. `b2_izen_sintagma_mugatzailea_erakuslea_izenlaguna` — izen-sintagma eta erreferentzia.
3. `b2_postposizio_askeak_ondoan_buruz_arabera` — postposizioaren funtzioa, kasua eta aldaerak.
4. `b2_partitiboa_ik_ezezkoak_eta_galderak` — partitiboa, komunztadura eta `-(e)nik` osagarriaren bereizketa.
5. `b2_izenondoen_mailakatzea_oso_nahiko_samar` — intentsitatearen ñabardurak eta egokitasuna.
6. `b2_juntadura_eta_edo_ala_baina` — juntadura eta lokailu diskurtsiboaren bereizketa.

**Ez da jatorrizko teoria bikoiztu.** Lehendik dauden `public_editorial_grammar_entries`
eta haien atalak erakusten dira. Lehendik sortuta zegoen juntadurako
ikasgai gidatua berrerabili dugu; bost fitxari ikasgai berriak gehitu zaizkie.

## Ikasketa-sekuentzia, bost fase

0. **Diagnostiko orientagarria (berria):** teoria irakurri aurretik, egoera
   komunikatiboari lotutako aukera bakarreko galdera; hiru aukera,
   hautuaren azalpen arrazoitua. Saiakera hori lehen erantzunaren argazkia da,
   ez gaitasun egonkor edo nota akademikoa. Lehendik gaia irakurria zuen
   ikaslearen erantzuna ezin da aurre-diagnostiko independente gisa interpretatu.
1. **Ulertu:** ikasgaiaren helburuak, egoera, adibide arrazoitua eta gramatika-bankuko azalpen osoa.
2. **Kontrastatu:** egitura konparatuak, aldaera onargarriak eta ohiko nahasmenak.
3. **Praktikatu:** 4 galdera, hiru aukera, bakoitzerako feedback bereizia;
   identifikatu → arrazoitu → kontrastatu → aplikatu.
4. **Erabili:** ekoizpen autonomoa, autoebaluazio-zerrenda, idatzizko
   bertsio-historia eta 72 ordu geroagoko beste egoerako transferentzia.

Gainerako ikasgaiek lehengo lau faseekin funtzionatzen jarraitzen dute;
diagnostiko berria sei gaietan bakarrik agertzen da.

## Datu-kontratua

Bi taula berri:
- `smx_grammar_b2_diagnostic_prompts`: 6 prompt original, erantzun-aukera
  arrazoituak, `prompt_version` eta `pilot_draft`.
- `smx_grammar_b2_diagnostic_attempts`: erabiltzaile eta gai bakoitzeko
  **lehen** erantzuna, `(user_id,entry_code)` PK. Ez dago ikaslearentzako
  UPDATE edo DELETE baimenik. Anonymous rolaren SELECT baimena ukatuta.
  RLS irakurketa: ikaslea bera edo bere taldeko irakaslea; idazketa: ikaslea bera,
  kontu aktiboa eta promptaren bertsio bateragarria.

Ez da datu pertsonalik jartzen gramatika-banku publikoan. Gonbidatuaren
diagnostikoa eta aurrerapena saio honetako memorian soilik gordetzen dira.
Irakaslearen panelean diagnostikoen **parte-hartzea** eta lehen hautuaren
ebidentzia ikus daitezke; ez dago gaitasun-maila automatikoki ondorioztatzen duen
eredu bat.

## Hedatzean aurkitutako arazoa eta konponketa

Aplikazioak 20 ikasgai eta 100 ariketa irakurtzeko muga zaharra zeukan:
`.limit(20)` / `.limit(100)`. 2026-11-23ko datuetan 29 ikasgai eta
116 ariketa daudenez, egiaztapenak ezin zuen osatutako ikasgai-kopurua
irakurri. Muga horiek `.limit(120)` eta `.limit(500)` bihurtu dira.
Gainera, ikasgai bakoitzeko lau ariketa eta konexio guztiak egiaztatzen dira.

## Datubaseko egiaztapenak (2026-11-23)

- Sei gaiak `smx_grammar_b2_lesson_designs` taulan daude.
- 6 × 4 = 24 praktika-item eskuragarri dira sei gaietan.
- 6 prompt diagnostiko; bakoitzak hiru aukera eta hiru feedback ditu.
- 29 ikasgai eta 116 praktika-item guztira egiaztatu dira (beste garapenak
  ere barne); 37 B2 gai mantentzen dira.
- Aurrerapen- eta esleipen-tauletako ikasleak ez dira ezabatu edo berridatzi.
- Taula berrietan RLS aktiboa, ez anon diagnostiko-saiakeren irakurketa.
- Ikasleen saiakerak ezabatu edo aldatzeko baimena ez zaio authenticated rolari ematen.

## Iturriak eta gobernantza

- `00_PROTOKOLO_KOMUNA.md`: arau-akatsak, aldaera onargarriak eta
  estilo-hautuak bereizteko printzipioa.
- `01_MATERIAL_SORTZAILEA.md`: egoera → diagnostikoa →
  praktika gidatua → transferentzia.
- `04_HIZKUNTZA_LABORATEGIA.md`: arau eta adieraren egiaztapena.
- Euskaltzaindiaren 39. araua: `lagundu` aditzaren NOR/NORI alternantzia.
- Euskaltzaindia, `Euskararen Gramatika` §§15.5, 14.10, 21.10, 28.1,
  28.5 eta 28.6; testuinguru eta aldaerei buruzko azalpen deskribatzaileak.

Ikasgaiak eta galderak `pilot_draft` egoeran mantentzen dira. Ez dira
HABEren/IVAPen ariketa ofizialak. Ez da bigarren berrikuspen independentea egin
denik adierazten, ezta ikasle baten jarduera-mailako arrakasta frogatu ere.

## QA

**Egiaztapen teknikoak:**
- SQL: sei ikasgai, lau galdera bakoitzeko, lau mikrotrebetasun, sei diagnostiko.
- RLS eta gutxieneko baimenak egiaztatuta.
- JS sintaxia eta DOM lotura estatikoak; PWA shell cache-bump.
- Vercel deploymenta READY eta commit zehatzarekin (hedapenean egiaztatu).

**Proba erreal falta da:**
- Ikasle autentifikatua / gonbidatua, diagnostiko lehen erantzuna,
  nabigazioa, feedback eta saio-berreskuratzea.
- Irakasle legitimoak bere taldeko erantzuna ikustea; beste irakasle batek
  ezin ikustea (RLS negatiboa).
- Ikasgai osoa egin eta 72 ordu geroko berrikuspena gordetzea bi gailutan.
- Mugikorreko bereizmena eta azken kontraste akademiko independentea.

Aldaketak hurrengo auditorian probatu; ez dira proba horiek amaitutzat hartzen.
