# SUSTRAI MAX · IRAKURMENA C1 · IVAP 2014/1 · A eredua

**Lanketa-data:** 2026-11-18 · **Egoera:** 34/34 azalpen-fitxa eginda; 33 behin-behineko argitaratuta eta item bat giza auditoria independentearen zain.

## 1. Azterketaren identifikazioa
- **Erakundea:** IVAP · Herri Arduralaritzaren Euskal Erakundea.
- **Maila:** Hirugarren hizkuntza-eskakizuna, **C1**.
- **Deialdiaren erreferentzia:** **2014/1 · A eredua**.
- **Jatorrizko kodea:** `3HE-IR-ID-03LAB_A`.
- [IVAPen PDF originala, irakurmena eta erantzun-gako inprimatua](https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/3HE-IR-2014_1.pdf).
- [Bankuan lotutako Google Drive-ko PDFa](https://drive.google.com/file/d/1bTBdLEEoM4oiYw80Qvwu0oyfei56vgdI/view).
- **Izenaren muga:** Drive-ko kopiak `2015-02-03 ... conv-2014-1` darama fitxategi-izenean; ez da izen horretatik deialdiaren egun zehatza ondorioztatu. PDFaren kodea eta IVAPen 2014/1 identifikazioa erabili dira.

**PDF historikoaren ezaugarriak:** irakurmenean 34 galdera, 18 + 9 + 7. 1. ariketako galdera bakoitzak 0,4 puntu; 2. eta 3. ariketetako bakoitzak 0,8; gehienez 20, gutxienez 10. Testuak dio erantzun okerrengatik ez dela punturik kentzen. **Puntuazio hori ez da beste deialdi batera kopiatu.**

## 2. Irakurgaiak, azalpenak eta gako ofiziala

| Ariketa | Irakurgaia | Itemak | Behin-behinean argitaratuak | Gordeak |
| --- | --- | ---: | ---: | ---: |
| 1 · Hutsuneak bete | «Arartekoaren 2013ko martxoaren 4ko ebazpena» | 1–18 (18) | 18 | 0 |
| 2 · Aukera anitzekoak | «Bundesliga eta ekonomia» | 19–27 (9) | 8 | 1 |
| 3 · Testu-zatiak txertatu | «Hau duk euskal umorea!» | 28–34 (7) | 7 | 0 |
| **Guztira** | | **34** | **33** | **1** |

- **1. ariketako gakoa**: B C A A D C D D B C A C B D B A C D.
- **2. ariketako gakoa**: C B B A C A B C A.
- **3. ariketako gakoa**: D H F B E G A; **C aukera soberan**.
- `sustrai_private.sr_answer_keys` osorik mantendu da.
- **34/34 itemetan** azaldu da erantzunaren arrazoia, jatorrizko testuko froga eta kokalekua, *aukera oker bakoitza*, irakurketa-estrategia eta transferentzia-ariketa. **121 distraktore** aztertu dira: **119** argitaratutako azalpenenak eta **2** zirriborroan gordetakoarenak.
- Azalpenak SUSTRAIren **material didaktiko propioa** dira; ez dira IVAPen azalpen ofizialak eta ez dira giza adituek `approved` gisa egiaztatuak.

## 3. Zalantza akademikoa — FROGA_ESKASA

**2. ariketa, 27. itema. IVAPen gako ofiziala A** (aldatu gabe).

- **Jatorrizko irakurgaia:** «finantzak zaintzeko **gogo handirik ez dutelako**», eta telebista-eskubideak bestela banatzeko prest ez daudela.
- **A aukera ofiziala:** «Bundesligatik kanpo nahiko ilun, **ez baitago bertako eredua jarraitzeko asmorik**».
- **Arazoa:** «gogo handirik ez» eta «asmorik ez» ez dira hedadura semantiko berekoak. A gainerako aukerak baino egokiagoa izan daiteke, baina adierazpenaren intentsitatea ez da automatikoki berdina.
- **Erabakia:** azalpen osoa prest, baina `review_status='draft'`, `published_at=null`, `FROGA_ESKASA`. Erantzun ofiziala **A** mantendu da.
- [Berrikuspen akademiko independentearen issue #51](https://github.com/antoniourutz-dev/sustrai-irakurmena/issues/51).

## 4. Transkripzioaren kalitatea eta sorburuaren fideltasuna

**«Bundesliga eta ekonomia»** irakurgaiaren `public.sr_task_versions.passage_text` hasieran `teria Mummert` ageri zen: PDF originala berriz irakurrita, konpainiaren izena **«Steria Mummert»** da. Falta zen lehen `S` zuzendu da. Aurreko balioa, azken balioa, irizpidea, IVAP PDFaren lotura eta `official_answers_unchanged=true` erregistroa `sr_task_versions.content.transcription_correction_2026_11_18` metadatuetan gorde dira. Zuzendu aurretik ez zegoen ariketa horretako azalpenik; ondoren sortu direnek testu zuzenduaren hash-a dute.

**Egiaztapen bisual berezia:** IVAPen PDFaren 3. orrialdea irudi gisa erreproduzitu da, eta **1. ariketako 13. itemeko C aukera «azpisailkatu»** dela ziurtatu da. Web bidezko PDF testu-erauzketa batean «azpimarratu» irakurketa okerra agertzen zen; **ez da zuzenketa faltsurik aplikatu**. Datu-basean dagoen `azpisailkatu` da originalaren irakurketa zuzena. PDFko orrialdearen irudiak lehentasuna du automatizatutako erauzketa desadostuan.

Ez da beste itemik, enuntziaturik edo erantzun-gakorik aldatu.

## 5. Barneko QA eta segurtasuna

[QA SQL errepikagarria, irakurketa soilik](https://github.com/antoniourutz-dev/sustrai-irakurmena/blob/main/docs/qa/ivap_2014_1_irakurmena_release_check.sql).

**Supabasen exekutatutako kontrolen emaitza:**
- **34/34 PASS**, **0 hutsegite**: erantzun ofizialarekiko bat-etortzea, froga pasartearen barruan egotea, bertsio-hash zuzena, aukera okerren kopurua eta etiketak, azalpenaren luzera minimoa, estrategia eta transferentzia, testu-aipuen komatxoen oreka, ariketa-mota eta segurtasun-egoera.
- **33** `provisional` / `published_at` beteta; **1** `draft` / `published_at=null`.
- `public.sr_explain_after_grade_v2('ivap-2014-1')` → **33** azalpen ikusgarri zerbitzariaren ondorengo zuzenketan. Ez du 27. itemeko zirriborroa itzultzen.
- Funtzioaren `EXECUTE` baimena: `anon=false`, `authenticated=false`, `service_role=true`. Horrek ez du, berez, aplikazio osoko **E2E segurtasuna** frogatzen.

**Ez da eginda esan behar:** giza auditoria akademiko independentea, benetako ikasleen transferentzia-pilotua, nabigatzaileko E2E simulazio/entrenamendu osoa, teklatu-mugikorreko irisgarritasuna. Kontrol automatizatuak ez dira `APTO` irizpen akademikoa.

## 6. Bankuko egoera, 2026-11-18

- Irakurmeneko **32 azterketa** argitaratuak.
- Guztira **962 galdera**.
- **258 azalpen** argitaratuak (`provisional` edo `approved` egoera teknikoan).
- **704 galdera**, argitaratutako azalpenik gabe.

**Ondorio operatiboa:** IVAP 2014/1eko 34 itemak landu dira, 33 azalpen behin-behinean argitaratu dira, 27. itema giza ebaluaziora bideratu da, eta gako ofizial osoa aldatzeke dago.
