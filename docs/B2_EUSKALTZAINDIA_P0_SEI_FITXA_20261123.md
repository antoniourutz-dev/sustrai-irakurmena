# SUSTRAI · B2ko P0 gramatika-hedapena: Euskaltzaindiaren arauak

**Data:** 2026-11-23  
**Jatorrizko bilduma:** `Material euskera Euskaltzaindia` (erabiltzailearen Google Drive, iturri akademikoen gordailua).  
**Kanalak:** Supabase (eduki kanonikoa) + `/gramatika/` + `/gramatika/ibilbidea/`.  
**Egoera:** `draft / not_reviewed` jatorrizko fitxetan; `pilot_draft` ikasgaietan eta diagnostikoetan. **Ez dago bigarren berrikuspen akademiko independentea eginda.**

## Xedea eta egindako aldaketak

Lehendik zeuden 40 B2 gaiei sei gai berri gehitu zaizkie. Jatorrizko PDFetan oinarritutako azalpen eta ariketa **originalak** dira; ez da liburuen orrialderik edo taula luzeen berrargitalpenik egin. Sei fitxek guztira **42 teoria-atal, 24 forma, 42 adibide nagusi, 24 forma-adibide baino gehiago** dituzte (egungo datu-baseko zenbaketa egiaztatu behar da fitxa zabaldu ondoren). Datuak `editorial_grammar_entries`, `editorial_grammar_entry_sections`, `editorial_grammar_forms`, `editorial_grammar_entry_examples` eta `editorial_grammar_form_examples` tauletan daude.

| B2 kodea | Arloa | Egiaztatu den iturria | Ñabardura nagusia |
|---|---|---|---|
| `b2_behar_eta_nahi_izan_jokabidea` | Aditza | [113. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0113.pdf) eta [114. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0114.pdf) | NOR-NORK eredu orokorra, NOR-NORI datiboa eta onartutako euskalki-aldaerak |
| `b2_aditzoina_eta_partizipioa_28_araua` | Aditza | [28. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0028.pdf) | Forma arautua vs haren erabilera sintaktikoa; eratorrietako aukera bikoitza |
| `b2_data_idazkera_kasu_marka_37_araua` | Ortografia | [37. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0037.pdf) | Data inesiboa eta aposizioa ez dira trukagarriak |
| `b2_orduen_adierazpena_35_araua` | Ortografia | [35. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0035.pdf) | «ordu bata», HH:MM, 15:00etan vs 15:03an; orduen aldaerak |
| `b2_letra_larriak_xeheak_gutun_eta_testuetan` | Ortografia | [200. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0200.pdf) | Gutun-hasierako agurra, bi puntuak eta izen bereziak |
| `b2_zenbakizko_adierazpenak_203_araua` | Ortografia | [203. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0203.pdf) | Milakoen zuriuneak, koma dezimala, % 25 eta ISOren salbuespen teknikoa |

Azken biak 2024ko eta 2025eko Euskaltzaindiaren EBO arau eguneratuak dira. Ez dira ordezkatu zaharragoko oharrekin. 203. arauko grafia-arau orokorra `% 25` da; `25 %` ISOren ordena espezialitateko testuetan ere onartua dago. Hori **ez da arau-akatsa** testuinguru horretan.

## B2ko ibilbidearen integrazioa

- 1. modulua: 7 → 9 gai (behar/nahi + aditzoina).
- 7. modulua: 4 → 8 gai (data, ordua, letra larriak, zenbakiak).
- Beste bost moduluetako eta lehendik zeuden gaien kodeak ez dira aldatu.
- `global_order` 1–46, bikoizketarik gabe. `pilot_active` historikoak ez dira aldatzen; frontendak ikasgaiaren existentziatik kalkulatzen du benetako egoera.
- Supabasen `smx_grammar_b2_lesson_designs` 6 ikasgai berri.
- `smx_grammar_b2_practice_items` 24 item berri (4/gai), trebetasunak `identifikatu → arrazoitu → kontrastatu → aplikatu`.
- `smx_grammar_b2_diagnostic_prompts` 6 hasierako diagnostiko orientagarri berri.
- Lehengo ikasleen aurrerapen-, berridazketa- eta irakasle-esleipenak ez dira eguneratu edo ezabatu.
- Lehendik zegoen 72 orduko geroko transferentzia-funtzionalitatea erabiltzen da; ez da probatu benetako ikasle kontuz sorta honetan.

## Hitz-ordenaren fitxa kanonikoaren sakontzea

Ez da bikoiztu `b2_hitz_ordena_argitasuna_eta_galdegaia`:

- «Hiru galdera hitz-ordena erabaki aurretik» atala gehitu.
- «Praktika: informazioaren fokua aldatzean» atala gehitu.
- SOA eta SAO hurrenkera bereizteko bi adibide kontrastibo original gehitu.
- Iturria berrirakurrita: Euskaltzaindia, Jagon Saila (2011), *Hitz-ordena. Erabilera estrategikoa*.
- Aldaketa horrek jatorrizko fitxaren hash-a aldatu duenez, pilotuko irakurketa-askatze erregistroaren hash-a eguneratu da. Ez da `approved` egoerara pasatu.

## Auditoria teknikoa

- 6 fitxa berri = 6 `draft/not_reviewed` eta 6 irakurgarri pilotuaren askatze-baimenarekin, jatorrizko bertsioarekin eta hash-arekin bat.
- 6 ikasgai, bakoitzeko lau galdera, hiru erantzun-aukera, hiru feedback eta lau mikrotrebetasun bereizi.
- 6 diagnostiko pilotu; kontudunen lehen saiakeraren irakurketa/iraunkortasuna aurreko kodearekin kudeatzen da.
- B2ko ibilbideak 46 gai ditu, eta guztiek katalogoaren erreferentzia dute.
- Frontendeko `MAX_PATH_UNITS=100`, `ITEMS_PER_LESSON=4`, eta datuen karga dinamikoa egiaztatu dira; 46 gai/43 ikasgai/172 item egungo mugetan sartzen dira.
- JavaScripten sintaxia egiaztatu da. Ekoizpeneko Vercel deploymentaren egoera `READY` zen DB-aldaketen ostean. Backendeko eduki berriak irakurtzeko ez zen frontend kode-aldaketarik behar.
- Emandako zenbaketak **ez** dira ikasleen benetako ikaskuntzaren ebidentzia.

## Oraindik egitekoak (kalitate-ateak)

- [ ] Beste berrikusle independente batek sei teoria-fitxen, 24 aukerako ariketen eta diagnostikoen zuzentasuna baieztatzea.
- [ ] Benetako ikasle-kontuarekin hasierako diagnostikoa, 4 praktika, transferentzia eta 72 ordu geroagoko gorde/irakurri proba.
- [ ] Irakasle-kontu legitimoaren taldearen sarbidea eta RLS sarbide-debekua probatzea.
- [ ] Mugikorreko interfazearen bisualizazioa, urduritasun-guneak eta irisgarritasuna probatzea.
- [ ] Driveko fitxa kanonikoen argitalpena eta irakurketazko egiaztapena; `gordetzeko_zain` egoera mantendu.
- [ ] Hurrengo aditz-sorta: aspektua, ahalera, agintera eta aditz sintetikoaren sakontze sistematikoa.
- [ ] Hurrengo EBO-sorta: 196–198, 202 eta 204 arauetako gaiak; jatorrizko edukiak irakurri eta eguneratu.

**Copyright:** Euskaltzaindiaren PDFak kontsultatu ditugu iturri gisa. Ez da bertako kapitulu, paradigma oso edo ariketa-sortarik kopiatu. Eduki berria SUSTRAIrako originala da; jatorrizko iturrietarako URL ofizialak gorde dira.

**Erabilera-oharra:** ikasmaterial pilotuak ez dira HABE/IVAPen ariketa ofizialak eta ez dute giza auditoria independentea ordezkatzen.
