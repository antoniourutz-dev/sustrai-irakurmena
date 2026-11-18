# SUSTRAI MAX · IRAKURMENA C1 · IVAP 2016/1 · A eredua

**Azterketa identifikatzeko katalogoko etiketa:** `ivap-2016-1` · **Lanketa-data:** 2026-11-18 · **Datu-bankuko egoera:** 34/34 azalpen-fitxa landuta, **31 behin-behineko argitaratuta**, 3 `FROGA_ESKASA` zirriborroan. **Giza auditoria independentea egiteke; ez da `approved` edo `APTO` irizpenik eman.**

## 1. Jatorria eta egiaztapenaren muina

- Erakundea: **IVAP** · hirugarren hizkuntza-eskakizuna (**C1**) · irakurmena, A eredua.
- **PDFaren kode inprimatua:** `3HE-IR-ID-22LAB_A`.
- [Jatorrizko PDFaren kopia, SUSTRAI Google Drive](https://drive.google.com/file/d/1O4xMqAKD_Xr0S_qfpbJDz5rRca9fr7Sh/view).
- Driveko artxiboaren izena: `Examen euskera C1 IVAP 2017-03-23 idatzizkoa.pdf`; katalogoan, ordea, deialdia `2016/1` da. **Ez da bi erreferentzia horietatik deialdiaren egun zehatza asmatu**, eta `session_date` bere horretan uzten da.
- PDFaren **2., 4., 5., 6., 7. eta 13. orriak** tokian bertan errendatu dira; inprimatutako **13. orrialdeko gako osoa** datu-bankuan jatorriz gordetako 34 erantzunekin bat dator.
- **Proba historiko honen baldintzak PDFaren arabera:** 3 ariketa eta 34 item; lehen ariketako itemek 0,4 puntu, beste bietakoek 0,8; guztira 20 puntu gehienez eta 10 gutxienez; irakurmenak 50–60 minutu eta erantzun okerrek zigorrik ez. Ez orokortu parametroak beste deialdietara.

## 2. Ariketa osoen egoera

| Ariketa | Izenburua | Itemak | Argitaratu `provisional` | `draft` |
| --- | --- | ---: | ---: | ---: |
| 1 · Hutsuneak bete | «Olatuen indarra hobeto iragartzeko» | 1–18 (18) | 17 | 1 |
| 2 · Aukera anitza | «Infekzioen globalizazioa» | 19–26 (8) | 6 | 2 |
| 3 · Testu-zatiak txertatu | «John Michell, izar ilunak» | 27–34 (8) | 8 | 0 |
| **Guztira** | | **34** | **31** | **3** |

**IVAPen gako ofiziala (PDFko 13. orrialdea):**
- 1–18: **C B D B A D A C B A C D B C A C D D**
- 19–26: **C B B A A B C A**
- 27–34: **C A H B I E G D**; **F** aukera soberan

`sustrai_private.sr_answer_keys` gakoak eta `public.sr_items` galdera nahiz aukerak **ez dira aldatu**.

## 3. Azalpenen edukia eta distraktoreen estaldura

**34/34 fitxak** `sustrai_private.sr_item_explanation_reviews` taulan, `revision=1`: gakoaren arrazoia, jatorrizko pasarteko ebidentzia zuzena eta kokalekua, beste aukera guztien arrazoi bereiziak, irakurketa-estrategia eta transferentzia-jarduera. SUSTRAIren azalpen propioak dira, **ez IVAPen azalpen ofizialak**.

| Ariketa | Distraktore-azalpen guztiak | Argitaratutakoenak |
| --- | ---: | ---: |
| 1 | 54 | 51 |
| 2 | 16 | 12 |
| 3 | 64 | 64 |
| **Guztira** | **134** | **127** |

**Edukien ildoak:**
- 1: ikerketa-datuetatik ondorioak ateratzea, aldizkakotasuna, energiaren fluxuaren etena, prototipoen garapena, itsas olatuen iragarpenerako algoritmoak, itsas energiaren eta sare elektrikoaren beharrak. 2015eko informazio energetikoa, ez datu garaikideen neurketa.
- 2: infekzio berriak edo lekualdatuak, inkubazioaren eta bidaien denborak, bektoreak, zoonosiak, fauna eta gizakien arteko kontaktua, txertaketa eta nazioarteko osasun-erakundeen zeregina. 2015eko dibulgazioa da, **ez osasun-aholku edo gaurko epidemiologia**.
- 3: John Michellen biografia eta ikerketa historikoa, iman artifizialak, Cavendishen adiskidetasuna, izar ilunen hipotesia, makinaren bidezko Lurraren pisatzea eta zabalkunde akademiko eskasa. **Anaforak, kontraste-lokailuak eta paragrafoen progresioa** dira testu-zati bakoitzaren kokapenaren oinarria.

## 4. FROGA_ESKASA — 3 galdera ezkutuan

[GitHub issue #55 · giza auditoriarako hiru auziak](https://github.com/antoniourutz-dev/sustrai-irakurmena/issues/55).

1. **7. itema · erantzun ofiziala A «eten».** «Energia-jarioa eten egiten da» da testuko aldizkakotasuna izendatzeko kolokazio zehatza. Hala ere, D «desagertu» hitzarekin «jarioa desagertu» ulertu daiteke bestelako testuinguru batean; ezin da automatikoki `ARAU_AKATSA` deitu. Egokitasuna eta kolokazioaren ñabardura giza auditoreak aztertu behar ditu. **A mantendu; `draft`, `published_at=null`.**
2. **22. itema · erantzun ofiziala A.** West Nile birusaz testuak «**hegaztietan** haren patogenotasuna» handitu dela dio. A-k «hilgarriagoa» generikoa erabiltzen du. Aukeraren parafrasi laburtua testuan defendagarria izan liteke, baina ezin da gizakien hilgarritasun handiagora hedatu. **A mantendu; `draft`, `published_at=null`.**
3. **24. itema · erantzun ofiziala B.** OMEren planak testuan gaixotasun batzuk **ezabatzeko** dira. B aukerak helburua gatazka armatua duten lurraldeetara eta «lehendik ustez ezabatutako» gaixotasunetara mugatzen du; horrek testuan ageri den egoera jakinaren eta planaren helburu orokorraren arteko inferentzia eskatzen du. **B mantendu; `draft`, `published_at=null`.**

Hiru itemetan gako ofizialak bere horretan mantendu dira. Ez da alternatiba ofizial berririk onartu.

## 5. PDFaren transkripzioa berreskuratzea (hiru konponketa)

Jatorrizko PDFaren irudiak eta `public.sr_task_versions.passage_text` alderatu ondoren, hiru pasartetan **azalpenak sortu aurretik** zuzenketa ez-semantikoak egin dira:

1. **«Olatuen indarra»**: testuaren hasieran itsatsitako `OLATUEN INDARRA HOBETO IRAGARTZEKO` izenburua testutik bereizi eta amaieran bikoiztutako puntua kendu.
2. **«Infekzioen globalizazioa»**: lehen «A» letra berrezarri (`zken urteotan` → `Azken urteotan`) eta PDFaren orri-aldaketatik tartean sartutako `INFEKZIOEN GLOBALIZAZIOA` izenburua kendu.
3. **«John Michell»**: 31. eta 32. hutsuneen artean ageri zen, PDFko orri-buruari zegokion `JOHN MICHELL, IZAR ILUNAK` testua kendu, jatorrizko artikuluaren esaldia ukitu gabe.

`sr_task_versions.content.pdf_transcription_cleanup_2026_11_18` eremuan aurreko pasartearen MD5a, PDFko orrialdea, iturria eta justifikazioa gordeta daude; ondorengo azalpenek pasarte garbituaren MD5a dute. **Ez dira aldatu testuko 34 itemen hutsune-markak, enuntziatu ofizialak edo erantzun-aukerak.**

## 6. Kalitate-proba erreproduzigarria eta sarbide-mugak

[GitHuben gordetako SQL QA kontrola](https://github.com/antoniourutz-dev/sustrai-irakurmena/blob/main/docs/qa/ivap_2016_1_irakurmena_release_check.sql).

**GitHubetik berreskuratutako QA SQL Supabasen benetan exekutatu da; emaitza: 0 akats-errenkada, 34/34 kontrol automatizatu gaindituta.** Egiaztatuta: gako ofizialak, jatorrizko aipuen existentzia eta komatxoen oreka, pasartearen hash-a, distraktoreen etiketak eta azalpenak, transferentzia, hiru zirriborroen egoera eta iturrien trazabilitatea.

- **31** `provisional` / `published_at` ez-hutsa, **3** `draft` / `published_at=null`.
- `public.sr_explain_after_grade_v2('ivap-2016-1')` → **31** azalpen; ez ditu hiru zirriborroak itzultzen.
- `has_function_privilege`: `anon EXECUTE=false`, `authenticated EXECUTE=false`, `service_role EXECUTE=true`. Horrek zuzenean funtzioa deitzea mugatzen du; ez da berez erabiltzaile-interfazeko E2E segurtasun-proba.

**Falta dira:** euskal hizkuntzalarien **giza auditoria independentea**, ariketa egiteko eta zuzentzeko benetako nabigatzaileko proba, mugikorreko eta teklatuko irisgarritasuna, ikasleen transferentzia-pilotua eta eraginkortasunaren neurketa. Ez markatu `approved` edo `APTO` froga horiek gabe.

## 7. Irakurmeneko bankuaren egoera orokorra

2026-11-18ko Supabase inbentario errealaren arabera:
- **32** irakurmen-azterketa argitaratu, **962** galdera.
- Lehenagoko **353** azalpen argitaratuei oraingo **31** gehitu: **384/962**, **% 39,92**.
- **578** galdera oraindik azalpen argitaraturik gabe, tartean auditoriarako ezkutatutako itemak.

**Hurrengo helburua**: katalogoko `ivap-2016-11-05`, orain arteko 34 galdera eta azalpen argitaraturik gabe, jatorrizko PDFarekiko eta gako ofizialarekiko berrikuspen berberarekin.
