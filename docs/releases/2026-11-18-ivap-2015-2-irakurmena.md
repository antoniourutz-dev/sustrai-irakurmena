# SUSTRAI MAX · IRAKURMENA C1 · IVAP 2015/2 · A eredua

**Lanketa-data:** 2026-11-18 · **Egoera:** 34/34 galderen azalpen didaktikoak landuta; **31 `provisional` argitaratuta**; **3 `draft`** `FROGA_ESKASA` ebidentzia-oharrekin. Giza auditoria akademiko independentea ez da egin; **ez jarri `APTO` edo `approved`**.

## 1. Jatorrizko iturria eta identifikazioa

- Erakundea: **IVAP** · 3. hizkuntza-eskakizuna (**C1**).
- SUSTRAIko katalogoko deialdia: **2015/2**, A eredua.
- PDFaren jatorrizko kodea: **`3HE-IR-ID-16LAB_A`**.
- [Jatorrizko IVAP PDFaren Google Driveko kopia](https://drive.google.com/file/d/1aTF6k9AGy2kMSfrM54OWALrYWc2h4Osy/view).
- Artxiboaren izena: `Examen euskera C1 IVAP 2016-03-04 idatzizkoa.pdf`. **2015/2** katalogoko deialdi-etiketa da; PDF artxiboaren izeneko datatik **ez dugu asmatu** katalogoko `session_date` (datu-basean `null` dago).
- Dokumentuaren 13. orria **irudi gisa** begiratu da eta hiru ariketen **34 erantzun ofizialak** bat datoz datu-basean daudenekin. 2., 4., 6. eta 7. orrien testua tokian bertan aterata eta alderatuta dago; 7. orriko irudia ere berrikusi da, zati hautagaiak eta testuaren zenbaki problematikoa ikusteko.
- PDFaren araberako irakurmenaren **azterketa historiko honen baldintzak**: hiru irakurgai, 34 galdera, lehen ariketako 18 itemak 0,4 puntu eta beste 16ak 0,8; **20 puntu** gehienez, **10 puntu** gutxienez, **50–60 minutu** aurreikusiak, eta erantzun okerrengatik zigorrik ez. Ez hedatu deialdi honen parametroak besterik gabe beste urteetara.

## 2. Ariketak, itemen eta distraktoreen estaldura

| Ariketa | Irakurgaia | Itemak | `provisional` argitaratu | `draft` |
| --- | --- | ---: | ---: | ---: |
| 1 · Hutsuneak bete | «Euskarazko azpitituluak» | 1–18 (18) | 16 | 2 |
| 2 · Aukera anitzak | «Arartekoa, pobreziaren kontrako egunean» | 19–26 (8) | 8 | 0 |
| 3 · Testu-zatiak txertatu | «Xibarta baleak» | 27–34 (8) | 7 | 1 |
| **Guztira** | | **34** | **31** | **3** |

**Gako ofiziala, jatorrizko 13. orrialdean irudiz egiaztatuta:**
- **1–18:** C A D B B D B D B C D B C D A C A C.
- **19–26:** A B B C A A B C.
- **27–34:** D A G I C F E B; **H aukera soberan**.
- `sustrai_private.sr_answer_keys` taulan ez da aldaketarik egin; `public.sr_items.options` aukerak eta enuntziatuak ere **bere horretan mantendu dira**.

**34/34 azalpen-fitxa** `sustrai_private.sr_item_explanation_reviews` taulan daude. Fitxa bakoitzak: erantzun ofizialaren arrazoibidea; jatorrizko testuaren zati zehatza eta kokalekua; distraktore bakoitzaren azalpen propioa; irakurmen-estrategia; eta beste gai edo egoera baterako transferentzia-jarduera dauzka. Ez dira erakunde ofizialaren azalpenak.

| Ariketa | Distraktore guztiak azaldu | Argitaratutako fitxetakoak |
| --- | ---: | ---: |
| 1 | 54 | 48 |
| 2 | 16 | 16 |
| 3 | 64 | 56 |
| **GUZTIRA** | **134** | **120** |

## 3. Irizpen independentea behar duten hiru azalpenak

[GitHub issue #54 · FROGA_ESKASA berrikuspenak](https://github.com/antoniourutz-dev/sustrai-irakurmena/issues/54).

**1. ariketa, 6. galdera · D `beraz` ofizialki.** Aurreko bikoizketa-zailtasunetik azpitituluen alternatibara ondoriozko jauzia egiten da. Baina C aukera, `hala ere`, kontraste edo kontzesio pragmatikoaren bidez erabil liteke zenbait irakurketatan. Ez deitu C formari arau-hauste objektibo; giza auditoreak baloratu behar du zehazki zenbateraino den aldaera onargarria. **D gakoa mantendu; azalpena `draft`, `published_at=null`.**

**1. ariketa, 15. galdera · A `abantaila` ofizialki.** Ondoko bi elementuak onurak dira: euskararen ikusgarritasuna eta kostu txikiagoa. C `ezaugarri` gramatikalki eta semantikoki onargarria izan daiteke, onurak ezaugarri positibo ere badirelako. A zehatzagoa da, baina ez da nahikoa C arau-akats gisa sailkatzeko froga. **A gakoa mantendu; azalpena `draft`, `published_at=null`.**

**3. ariketa, 34. galdera · B ofizialki.** B zatiak `soinu horiek` anaforarekin kantuak berrartzen ditu, eta hurrengo pasarteak uhin-luzera eta transmisio-distantzia azaltzen ditu. Hala ere, PDFaren 7. orrian `106 biteko informazioa` eta `Iliada edo Odisea` alderatzen dira; literalki **106 bit = 13,25 byte**, eta parekatze hori zientifikoki susmagarria da. Litekeena da notazioa eta jatorrizko iturria aztertzea beharrezkoa izatea; ez dugu isilean `10^6` edo beste kopururik inposatu. B zatiko **15.000 kilometroko** transmisioa ere ez dago hemen kanpoko ikerketa independente batez egiaztatuta. **B gakoa mantendu; azalpena `draft`, `published_at=null`.**

**Ez da itemetako gako ofiziala zuzendu, ezta alternatiba ofizial berririk onartu ere.** Fitxak landuta daude, baina ez dira kalifikazioaren ondoren ikasleari azalpen ziur gisa erakusten.

## 4. Jatorrizko testuen fideltasuna: hiru zuzenketa

PDFa eta Supabaseko `public.sr_task_versions.passage_text` testuak alderatuta, hiru dokumentazio-akats aurkitu eta konpondu dira **azalpenak sortu aurretik**:

1. **Euskarazko azpitituluak:** amaierako testuan PDFko izenburua berriro itsatsita zegoen; orri-buru flotatzailea kendu da, testuaren edukia galdu gabe.
2. **Arartekoa:** lehen `U` letra falta zen, `rriaren 17a` geratuta; PDFaren 4. orrialdearen arabera **`Urriaren 17a`** berrezarri da. Amaierako izenburu flotatzailea ere kendu da.
3. **Xibarta baleak:** lehen esaldiaren zatia lekuz aldatu zen, testua `alderatzeko.` hitzean hasita; PDFaren 6. orrialdeak ageri duen **`Xibartek, balaenopteridae multzoan...`** hasiera berreskuratu da eta 33. galderaren inguruan lekuz kanpo zegoen kopia kendu da.

`sr_task_versions.content.pdf_transcription_cleanup_2026_11_18` metadatuek konponketaren arrazoia, PDFko orrialdea, jatorrizko iturriaren esteka, aurreko testuaren **MD5** hash-a eta gakoak aldatu ez direla gordetzen dituzte. Ondoren sortutako 34 azalpenek **egungo pasartearen hash-a** daramate.

## 5. Kalitate-atea, zerbitzuaren sarbidea eta mugak

[SQL QA erreproduzigarria (irakurketa soilik)](https://github.com/antoniourutz-dev/sustrai-irakurmena/blob/main/docs/qa/ivap_2015_2_irakurmena_release_check.sql).

**GitHubetik bertatik berreskuratutako SQL egiaztapenaren emaitza Supabasen:**
- **34/34 proba automatizatu gaindituta, 0 akats-errenkada.**
- Gakoen bat-etortzea, jatorrizko aipuen posizioa eta luzera, bertsio-hash-a, distraktore bakoitzaren etiketa eta arrazoia, irakurketa-estrategia eta transferentzia, hiru zirriborroen ezkutatzea eta iturriaren fideltasuna egiaztatuta.
- **31 `provisional` / `published_at` beteta** eta **3 `draft` / `published_at=null`**.
- `public.sr_explain_after_grade_v2('ivap-2015-2')` funtzioak **31** azalpen itzultzen ditu, ez hiru zirriborroak.
- Zuzeneko funtzioaren exekuzio-baimenak: `anon=false`, `authenticated=false`, `service_role=true`.

**Mugak:** proba automatizatua **ez** da giza hizkuntzalari independiente baten `APTO`; ez da benetako nabigatzaileko simulazio/entrenamendu osoa probatu, ezta irisgarritasuna edo ikasleen transferentziaren eraginkortasuna ere. Funtzioaren sarbide murriztua egiaztatzeak ez du, berez, aplikazioaren E2E segurtasuna frogatzen.

## 6. Estaldura orokorra eta hurrengo deialdia

2026-11-18ko datu-bankuko inventarioaren arabera:
- **32** irakurmen-azterketa argitaratu, **962** item.
- Aurreko **322** azalpen argitaratuei **31** gehituta: **353/962** azalpen argitaratu (**% 36,69**).
- **609** galdera, oraindik azalpen argitaraturik gabe.
- Hurrengo deialdiko `ivap-2016-1` erregistroak **34** galdera ditu eta ez du azalpen argitaraturik.

**Ondorioa:** 2015/2ko azterketa osoa landuta eta oinarrizko iturri-kontrolak gaindituta dago. 31 azalpen behin-behinean argitaratu dira; 3 zirriborro giza auditoriarako gordeta geratu dira, IVAPen gakoa aldatu gabe.
