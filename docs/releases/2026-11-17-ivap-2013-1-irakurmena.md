# SUSTRAI MAX · IRAKURMENA C1 · IVAP 2013/1 · A eredua

**Eguna:** 2026-11-17 · **Protokoloa:** SUSTRAI MAX 00/01 v2.1.0 · **Kalitate-egoera:** behin-behinekoa, akademia-auditoria independentea egin gabe.

## Identitatea eta jatorriak

- **Erakundea:** IVAP / Herri Arduralaritzaren Euskal Erakundea.
- **Maila:** 3. hizkuntza-eskakizuna / C1.
- **Deialdi historikoa:** 2013/1 · A eredua · **3HE-IR-ID-01LAB-A**.
- [PDF ofiziala, enuntziatuak eta erantzun-gakoa (azken orrian)](https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/eu_def/adjuntos/3HE-IR-ID-01LAB_A.pdf).
- [Datu-basean lotutako Driveko PDFa](https://drive.google.com/file/d/1HXsOSeWWbr_-Txe8oP-MO5MhqWP0Cems/view).
- **Artxibo-izena desadostasun txikia:** Drive-n izenak «2014-02-25 ... conv-2013-1» dio; azterketaren edukian kodea `3HE-IR-ID-01LAB-A` agertzen da eta `ivap-2013-1` slugarekin bat dator. Izen hutsarekin ez da azterketa-egun zehatza asmatzen.
- **Iturrien egiaztapena:** Driveko PDFko testu-erauzketa, IVAPen webguneko PDF publikoaren testua eta azken orriko gakoa kontrastatu dira. Webeko PDF pantaila-argazkiaren saiakera cache-akatsagatik huts egin du; **ez dugu PDFko orrialde guztien ikusizko egiaztapen osoa baieztatzen**.

## Azterketaren formatua

Azterketan **34 item** daude, ez 25:
- 1. ariketa: «Etxebizitza hutsak» · **9 aukera anitzeko galdera**, 0,8 puntu bakoitza.
- 2. ariketa: «Interneteko komunikazioen segurtasuna: konfidentzialtasuna» · **18 hutsune**, 0,4 puntu bakoitza.
- 3. ariketa: «Beharrezkoa al da aintzat hartzea?» · **7 testu-zatiren aukeraketa**, 0,8 puntu bakoitza, **D aukera soberan**.

**Pisuak PDFtik jasotakoak dira**, eta ez dira SUSTRAIren metrika asmatua. Erantzun okerrek ez dute zigorrik 2013/1 PDFaren arabera.

## Eduki-diagnostikoa eta argitaratzea

| Ariketa | Fitxak | `provisional` argitaratuta | `draft` |
| --- | ---: | ---: | ---: |
| Etxebizitza hutsak | 9 | 7 | 2 |
| Interneteko komunikazioen segurtasuna | 18 | 18 | 0 |
| Beharrezkoa al da aintzat hartzea? | 7 | 7 | 0 |
| **GUZTIRA** | **34** | **32** | **2** |

- **34/34 fitxetan** jatorrizko pasartea, haren kokalekua, gako ofizialaren arabera aukeratutako erantzunaren azalpena, aukera oker guztien arrazoia, irakurketa-estrategia eta transferentzia-jarduera gorde dira `sustrai_private.sr_item_explanation_reviews` taulan.
- **121 distraktore** aztertu dira (18 + 54 + 49); horietatik **117** 32 azalpen argitaratuei dagozkie. Bi fitxa zalantzazkoetan beste **4** gorde dira berrikusteko.
- **Gakoak ez dira aldatu.** Gakoa `sustrai_private.sr_answer_keys` taulan mantendu da, eta azalpen bakoitzak `accepted_options_snapshot` gordetzen du.
- **Pasarteen egiaztapena:** aipu bakoitza `public.sr_task_versions.passage_text`-en ageri da; `md5:` bertsio-aztarnak bat datoz.
- **Testuinguru historikoa:** 2010 inguruko etxebizitza-estatistikak, lege-proposamenak eta Interneteko zifratze-sistemen segurtasunari buruzko baieztapenak **iturriaren garaikoak dira**. «Erabat hauskaitzak» ez da gaur egun kode guztiak erasoezinak direnik frogatzeko erabiliko.
- **Psikologiako pasartea:** egileak «zure pentsamenduek izan ezik, ezerk ezin zaitu mindu» bezalako baieztapen indartsua egiten du; ez da egitate psikologiko unibertsal frogatutzat aurkezten.

## FROGA_ESKASA · 1. ariketako 6. eta 7. itemak

**6. itema, gako ofiziala C.** Elorzak lurzoru gehiago erabiltzeak ingurumenerako eta herrirako kalteak dakartzala dio. Aukerak, berriz, «kalterako **baino ez**» dio. Ez dago ondorio positiborik inoiz izan ezin dela frogatzeko behar beste ebidentziarik. Gako ofiziala dagoen bezala gorde da; azalpena zirriborroan, `published_at=null`.

**7. itema, gako ofiziala B.** Jatorrizko testuak dio Europako herrialde askotan etxebizitzen erdia baino gehiago «**alokairu soziala izatea edo alokairua**» dela ohikoa. Aukeran, ordea, «**alokairu publikokoa**» dio. Testuak alokairu mota guztiak publikotzat hartzeko ebidentzia nahikorik ez duela dirudi. Gako ofiziala dagoen bezala gorde da; azalpena zirriborroan, `published_at=null`.

Bi kasuetan hutsunea ez da ikasleari akats gisa egozten. **Giza auditoria akademiko independentea** behar da aukeren irismena argitzeko, aldaera onargarriak eta erantzunaren gehiegizko interpretazioa bereizita.

## Kalitatearen ate automatizatuak

[Kontrolaren SQL errepikagarria](https://github.com/antoniourutz-dev/sustrai-irakurmena/blob/main/docs/qa/ivap_2013_1_irakurmena_release_check.sql).

**Gauzatutako emaitza, Supabase:**
- **34/34** azalpen-fitxek argitalpenaren eta iturriaren kontrolak gainditu dituzte: gakoa, aukerak, pasartea eta hash-a, egitura, distraktore guztien azalpena, estrategiak, transferentzia eta zalantzazkoen egoera.
- **32** azalpen itzultzen ditu `public.sr_explain_after_grade_v2('ivap-2013-1')` zerbitzuak.
- `anon` → `EXECUTE=false`; `authenticated` → `EXECUTE=false`; `service_role` → `EXECUTE=true`. Zerbitzariaren barruko funtzioa da; ezin da erabili erabiltzaileari erantzun zuzenak saioa egin aurretik emateko.
- Ez da `approved` edo `APTO` egoerarik aldarrikatzen.

**Falta diren frogak:** giza zuzentzaile independentea, erronka-sekuentzia baten E2E benetakoa, simulazioan azalpenik ez dela erakusten egiaztatzeko nabigatzaile-proba, irisgarritasuna eta ikasleen benetako transferentzia-datuak. SQLren kontrolak ez ditu ordezkatzen.

## Bankuaren egoera, 2026-11-17

- **32** irakurmen-azterketa argitaratu.
- **962** galdera guztira.
- **202** azalpen argitaratu.
- **760** galdera oraindik argitaratutako azalpenik gabe.

**Ondorioa:** IVAP 2013/1 osoa landu da; 34 fitxak gorde eta 32 azalpen behin-behineko moduan argitaratu dira, gainerako biak akademikoki berrikusteko utzita, jatorrizko gako ofiziala aldatu gabe.
