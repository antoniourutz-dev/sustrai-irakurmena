# SUSTRAI MAX · Irakurmena C1 · IVAP 2013/2 · A eredua

**Entrega:** 2026-11-17 · **Egoera:** 25/25 fitxa prestatuak, 23/25 azalpen behin-behineko argitaratuak; bi item akademikoki zainduak eta argitaratu gabe.

## Identitatea eta iturriak
- **Erakundea:** IVAP · 3. hizkuntza-eskakizuna (C1).
- **Deialdiaren etiketa:** **2013/2 · A eredua**, `3HE-IR-ID-04LAB-A`.
- [IVAPeko azterketa eta erantzun-gako ofiziala, PDF berean](https://www.ivap.euskadi.eus/contenidos/informacion/azterketaren_ereduak_3he/es_def/adjuntos/3HE-IR-ID-04LAB_A.pdf).
- [Datu-bankuko jatorrizko Drive kopia](https://drive.google.com/file/d/11c0QSdA0hk_wwXaY5yLo_rFZPQsoVubd/view).
- **Izenaren ñabardura:** Driveko artxiboaren izenean «2014-02-25» ageri da; azterketaren barne-kode ofizialak `3HE-IR-ID-04LAB-A` identifikatzen du. Ez da deialdiaren egutegi zehatza asmatu.
- PDFko testu-erauzketa erabili da jatorrizko azterketa eta azken orriko erantzun-gakoa egiaztatzeko. Webetik PDFaren orrialdeen pantaila-irudiak eskuratzeko saiakerak cache-faltagatik huts egin du. **Ez dugu ikusizko berrikuspen osoa burututzat ematen.**

## Jatorrizko azterketaren parametroak (historikoak)
Irakurmena **25 item**, hiru ariketa eta hiru testu. Item bakoitzak **0,8 puntu** balio du; guztira **20 puntu**. Azterketaren argibideek gainditzeko **13 erantzun zuzen** eta huts egiteagatik zigorrik ez dagoela jasotzen dute. Ez kopiatu baldintza horiek beste IVAP/HABE deialdi batzuetara.

## Atazaz ataza

| Ariketa | Izenburua eta formatu ofiziala | Itemak | Provisional | Draft |
| --- | --- | ---: | ---: | ---: |
| 1 | «Hezigabeagoak bagina» · aukera anitzekoa | 1–9 | 8 | 1 |
| 2 | «Bularretik Mintzora» · testu-zatiak txertatzea | 10–16 | 7 | 0 |
| 3 | «Giza gorputzaren moldaera artifiziala» · bi zutabeak lotzea | 17–25 | 8 | 1 |
| **GUZTIRA** | | **25** | **23** | **2** |

Jatorrizko gakoak: 1. ariketa **B A C A C B C A B**; 2. ariketa **F D H A G C E** (**B** soberan); 3. ariketa **G E C B I A J H D** (**F** soberan). **`sustrai_private.sr_answer_keys` ez da aldatu.**

25 fitxetan SUSTRAIk bereizita gorde ditu: zuzenaren azalpena, jatorrizko pasarte egiaztatua eta kokalekua, gaizki aukeratzeko tentagarri den aukera bakoitzaren kontrastea, irakurketa-estrategia eta beste egoera baterako transferentzia-ariketa. Guztira **148 distraktore-azalpen** (18 + 49 + 81): **137 argitaratutako 23 fitxetan**, eta 11 bi `draft` fitxetan. Azalpenak **SUSTRAIrenak dira, ez IVAPen azalpen ofizialak.**

## Bi kasu akademikoki irekiak · FROGA_ESKASA

### 1. ariketa · 7. itema · gako ofiziala C
Jatorrizko testuak Robin Cembalest kritikariaren «Guggenheim bat, **tokian tokiko kultur edukirik gabe**, aberrazio bat da» baieztapena jasotzen du. C aukerak, ordea, kanpoko artisten sormen-lanak **soilik** egotea dakar. Bertako kultur edukirik eza eta kanpoko artisten lan guztiak bakarrik egotea ez dira derrigorrez baliokideak. Beste aukerak argi baztertzen badira ere, jauzi semantiko hori auditatu behar da. Ez da gako ofiziala aldatu; `draft`, `published_at=null`.

### 3. ariketa · 20. itema · gako ofiziala B
«Jirafa-emakumeen» eraztunek gaur egun turismoa erakartzeko erreklamo eta **diru-iturri** funtzioa dutela dio testuak. B aukerak, berriz, bisitarien **eskupekoak** aipatzen ditu. Sarreren jatorria ez da nahitaez eskupekoa; jatorrizko testuak ez du diru-sarrera mota zehazten. Ezin da automatismoz berdindu. Erantzun ofiziala B mantendu da; `draft`, `published_at=null`.

**Egoera pedagogikoa:** ikaslearen hautua eta testuko froga bereizi, ez jarri azken epai akademikorik eta ez ematen hasi kontzeptu mugatuak baliokideak direla giza adituen berrikuspena iritsi arte. Ez da giza auditoriarik egin.

## Iturriko inportazio-zuzenketak
PDFaren orrialde-burua irakurgaiaren barruan sartu zen hiru tokitan (`3HE-IR-ID-04LAB-A 3`, `... 5`, `... 7`). **Hiru `sr_task_versions.passage_text` kateetatik kendu da soilik orri-burua**, ez azterketaren eduki linguistikoa. Hutsuneen markak, aukera guztiak eta erantzun-gakoak ez dira aldatu.

- Aurretiko azpikatea, ordezkapena, jatorrizko PDFa eta arrazoia `sr_task_versions.content.pdf_transcription_cleanup_2026_11_17` barruan jaso dira, hiru ariketetan.
- 25 azalpenetako `source_version_hash` eguneratu da testuaren azken bertsioarekin.
- 25/25 aipuak jatorrizko pasartearekin bat datoz berriro, ez dago orri-bururik azalpenetan, eta komatxoak ondo mugatu dira.

## Kontrol automatizatua
[Errepikatzeko SQL proba](https://github.com/antoniourutz-dev/sustrai-irakurmena/blob/main/docs/qa/ivap_2013_2_irakurmena_release_check.sql).

- **25/25** azalpenek kontrolak gainditu dituzte: erantzun ofizialaren argazkia, jatorrizko aipuaren kokapena, pasartearen hash-a, distractor guztiak eta beren etiketak, egitura eta azalpenaren presentzia, iturriaren aipamena eta argitalpen-egoera.
- **23** `provisional` ikusgai dira `public.sr_explain_after_grade_v2('ivap-2013-2')` funtzioan; **2** ezkutuan dira `draft` moduan.
- `anon` **EXECUTE=false**; `authenticated` **EXECUTE=false**; `service_role` **EXECUTE=true**. Erantzunak ez dira erabiltzaile anonimoari edo autenticatuari zuzeneko RPC honetatik eskaintzen.
- **EZ da egin:** giza auditoria independentea; benetako nabigatzaileko saio E2E osoa (entrenamendua/simulazioa); mugikorreko eta teklatuko irisgarritasun-probak; ikasleen transferentzia-neurketa. Barneko kontrola ez da `APTO` edo kalibrazio akademikoaren baliokidea.

## Bankuko egoera, egiaztapenaren amaieran
- **32** irakurmen-azterketa argitaratu.
- **962** galdera.
- **225** azalpen argitaratu.
- **737** galdera oraindik azalpen argitaraturik gabe.

**Ondorioa:** 2013/2 azterketa osoaren azalpen pedagogikoak egin eta gakoarekin kontrastatu dira; 23 argitaratu dira entrenamenduaren ondoren, bi giza berrikuspenerako gordeta, eta testuen hiru inportazio-kutsadura ez-semantiko zuzendu dira trazabilitatearekin.
