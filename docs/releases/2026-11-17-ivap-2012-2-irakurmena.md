# SUSTRAI MAX · Irakurmena · IVAP C1 2012/2 · A eredua
**Data:** 2026-11-17 · **Egoera:** barne-kontrola eginda, giza auditoria akademiko independentea egiteke

## Iturria eta identitatea
- **Erakundea:** IVAP · 3. hizkuntza-eskakizuna (C1), **2012/2**, A eredua.
- **Azterketa ofiziala:** [IVAPen 2012/2 PDFa, 3HE-IR-ID-07ELH](https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/2012_2_3HE_ID.pdf).
- **Bankuan erabilitako kopia:** [Drive-ko jatorrizko PDFa](https://drive.google.com/file/d/1ToC4qVGcyj1TubqH-4lvBkAuqiSoArnU/view).
- **Gakoa:** PDF ofizialaren amaieran (azken orrialdea). Ez da aldatu.
- **Oharra:** Driveko fitxategiaren erakusleiho-izenean «2014-02-26» agertzen da, baina PDFaren kodea 3HE-IR-ID-07ELH da, eta IVAPek berak 2012/2 izenarekin argitaratzen du; ez da deialdiaren data zehatzik asmatu.
- **Egiaztapen-metodoa:** PDFko testu erauzia + IVAPen jatorrizko PDF publikoko testu eta gakoarekin kontrastea. Webguneko PDFaren irudi-argazkia ezin izan da eskuratu cache-hutsagatik: **ez aldarrikatu ikuste bidezko berrikuspen osoa**.

## Edukia eta argitalpena
| Ariketa | Galderak | Azalpenak `provisional` | `draft` |
| --- | ---: | ---: | ---: |
| 1. «Iruzurraren aurpegi berrituak» · bi zutabeak lotu | 9 | 8 | 1 |
| 2. «Zinpeko itzultzaile eta interpreteak» · erantzuna aukeratu | 9 | 9 | 0 |
| 3. «Llangollengo bildotsak» · zatiak sartu | 7 | 7 | 0 |
| **Guztira** | **25** | **24** | **1** |

- 25/25 galderatan **azalpen-fitxa** sortu da: erantzun ofiziala, jatorrizko testuan egiaztatutako aipu laburra eta kokalekua, aukera okerren arrazoia banan-banan, irakurketa-estrategia eta transferentzia.
- **148 distraktore-azalpen** landu dira; horietatik **139** dagozkie argitaratutako 24 fitxei, eta **9** zirriborroan gordetako galderari.
- Loturen gako ofiziala: 1. ariketa **D F G J B A I E H** (C soberan); 2. ariketa **C A B C B B A C A**; 3. ariketa **C E A B G F H** (D soberan).
- **`revision=2`** erabili da 1. eta 3. ariketen 16 fitxetan, distraktoreen azalpenen lehen bertsioan joskera mekanikoak eta soberako aukera bati buruzko atribuzio oker bat hauteman eta zuzendu direlako. Aurreko `revision=1` **ez da ezabatu**. 2. ariketako bederatzi azalpenen `revision=1` mantendu da.
- **Egungo legeei buruzko muga:** zinpeko itzultzaileen testuak 2009–2011 inguruko arauak eta egoera azaltzen ditu. Ez hartu gaur egun indarrean dagoen gaikuntza juridikoaren azalpentzat.
- **Beste muga bat:** Iruzurren artikuluak 2010 inguruko jokabideen deskribapena egiten du. Ez erabili herrialdeen edo iruzur-maiztasunaren daturik gaurko baieztapen gisa.

## Transkripzio-akats dokumentatua
3. ariketako H aukeran `Hortxe amaitu zen kontua. Lanak gelditu egin ziren. Idatzi dagokion letra ondoko laukietan:` zegoen; testu originaleko hurrengo orriko argibidea aukera-lerroan elkartu zen. **Hautagaiei ikusgarri izan behar den aukera zuzena:** `Hortxe amaitu zen kontua. Lanak gelditu egin ziren.`

- 7 itemetan (aukera berbera errepikatzen zelako) `public.sr_items.options` zuzendu da.
- Aurreko balioa, arrazoia, jatorria eta `official_key_unchanged=true` jaso dira `sr_items.metadata.transcription_correction_2026_11_17` eremuan.
- Gako ofizialaren balioa **ez da aldatu**.

## FROGA_ESKASA — 1. ariketa, 5. itema
**Gako ofiziala: B.** Esaldia: «419 iruzurraren izena Nigeriako Zigor Kodeko artikulu batengatik da». B aukerak aurreratutako dirua eskatzen dela azaltzen du, baina **«beste iruzurretan ez bezala»** ere badio. Testuan beste maula batzuetan ere aurretiazko dirua edo inbertsioa aipatzen da. Hortaz, konparazioa erabateko baieztapen gisa irakastea gehiegizkoa izan daiteke.

- `review_status='draft'`, `published_at=null` eta `FROGA_ESKASA` etiketa.
- Ez dugu IVAPen erantzun ofiziala aldatzen; ez dugu zalantzazko azalpena argitaratzen.
- Euskararen aditu independente batek ebaluatu behar du «beste iruzurretan ez bezala» esamoldearen esparru erreferentziala (phishingaren hasierako fasea ala aurkeztutako iruzur guztiak).

## Kalitate-kontrolak eta segurtasuna
- [QA SQL errepikagarria](https://github.com/antoniourutz-dev/sustrai-irakurmena/blob/main/docs/qa/ivap_2012_2_irakurmena_release_check.sql).
- **25/25** azken berrikuspenek gainditu dituzte gako-berdintasuna, pasartearen jatorria, pasartearen hash-a, distraktore-kopurua, distraktoreen izendapena eta arrazoien luzera, egitura, argitalpen-egoera eta ziurgabetasunaren etiketa.
- **24** azalpen itzultzen ditu `public.sr_explain_after_grade_v2('ivap-2012-2')` funtzioak; 5. itemeko zirriborroa ez da itzultzen.
- `anon`: `EXECUTE=false`; `authenticated`: `EXECUTE=false`; `service_role`: `EXECUTE=true`.
- **Ez da egin:** erabiltzaile erreal baten E2E proba, mugikorreko irisgarritasun-proba, ezta giza auditoria independentea ere. Kalitate-kontrol automatizatua ez da nahikoa edukiari `APTO` irizpena emateko.

## Egoera orokorra (Supabase 2026-11-17)
**32** irakurmen-azterketa argitaratu, **962** galdera, **170** azalpen argitaratu, **792** galdera argitaratutako azalpenik gabe.

**Ondorioa:** 2012/2 azterketako 25 galderak landu dira, eta 24 azalpen erabilgarri argitaratu dira entrenamenduaren zuzenketaren ondoren; item bakarra giza berrikuspenerako gordeta.
