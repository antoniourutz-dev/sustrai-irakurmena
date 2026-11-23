# SUSTRAI · B2ko aditzaren modalitatea eta ortotipografia — 2026-11-23

## Esparrua

Google Driveko *Material euskera Euskaltzaindia* bildumako jatorrizko iturrien kontrako lana. **Zortzi fitxa didaktiko original**, bi modulu berri (8 eta 9), eta ikasgaien jarduera gidatuak. Ez da PDF osoen edukia berrargitaratu: Euskaltzaindiaren 2021eko *Euskararen Gramatika* liburukiak eskubide-erreserba esplizitua dauka. Arauemaileen aipamenak eta azterketa didaktiko originala bereizi dira.

Jatorrizko dokumentuen edukia Google Driveko konektorearen bidez irakurri da. **Iturri arauemailea vs gramatika deskribatzailea** bereizi da; aldaera zilegiak eta estilo-hautuak ez dira arau-akats automatiko bihurtu.

| Fitxa kanonikoa | Iturri egiaztatuak | Irizpide nagusia |
|---|---|---|
| `b2_aspektua_burutua_burutugabea_geroa` | [85. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0085.pdf), *Euskararen Gramatika* (2021), I, §26.3.2 eta §26.6.1 | -tu, -t(z)en eta -ko/-en formak, aldia, aspektua eta testuingurua; `idazten dut` ≠ `idazten ari naiz` |
| `b2_ahalera_naiteke_dezaket_ahal_izan` | *Euskararen Gramatika* (2021), I, §26.3.5.2 eta §26.6.3.1; [78. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0078.pdf) | Gaitasuna vs gertagarritasuna; NOR/NOR-NORK; `etor naiteke` eta `etorri ahal naiz` |
| `b2_agintera_aginduak_jarraibideak_adeitasuna` | *Euskararen Gramatika* (2021), I, §26.1.5.4 eta §26.3.5.1; [28. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0028.pdf) | NOR eta NOR-NORK agintera, instrukzio laburrak eta adeitasun-maila |
| `b2_laburdurak_siglak_196_araua` | [196. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0196.pdf) (2023) | `etab.` ≠ `EHU` ≠ `km`; sigla + kasu-marka `EHUko` |
| `b2_sinboloak_neurri_unitateak_197_araua` | [197. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0197.pdf) (2023) | `5 km`, `5 km-ko`, `21 °C`; sinboloaren grafia aldaezina |
| `b2_letra_estiloak_etzana_lodia_198_araua` | [198. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0198.pdf) (2023) | Etzana metahizkuntzan, lodia hierarkian, arrunta oinarrizko testuan |
| `b2_puntuazioa_osagarriak_erlatiboak_202_araua` | [202. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0202.pdf) (2026) | Osagarri eta erlatibo arruntak komarik gabe; tartekiaren komak bestelakoak |
| `b2_atzerriko_izen_bereziak_204_araua` | [204. araua](https://www.euskaltzaindia.eus/dok/arauak/Araua_0204.pdf) (2026) | London/Londres; Mississippi ibaia; pertsona-izen modernoen jatorrizko grafia |

## Ezarpenaren egitura eta kopuruak

- Zortzi `editorial_grammar_entries` fitxa B2 mailan; bakoitzak 7 azalpen-atal, 4 forma, 7 adibide nagusi eta 8 forma-adibide ditu: **56 atal + 32 forma + 56 adibide + 64 forma-adibide**.
- `smx_grammar_b2_lesson_designs`: 8 ikasgai gidatu berri, `pilot_draft`.
- `smx_grammar_b2_practice_items`: **32 galdera berri**, gai bakoitzean lau trebetasun: `identifikatu`, `arrazoitu`, `kontrastatu`, `aplikatu`. Hiru aukera eta feedback bereizia galdera bakoitzean.
- `smx_grammar_b2_diagnostic_prompts`: **8 hasierako diagnostiko berri**, bakoitzean 3 aukera eta hiru azalpen.
- Praktika autonomoa + aurretik dagoen **72 ordu geroagoko berrikuspen** mekanismoa; ez da amaieratik amaierako erabiltzaile-probarik egin.
- **8. modulua**: `Aditzaren aspektua eta modalitatea`, 3 gai.
- **9. modulua**: `Ortotipografia eguneratua eta izenak`, 5 gai.
- Aurreko 7 moduluetako gai-kodeak, irakasle-esleipenak eta ikasle-aurrerapenak ez dira berridatzi.
- `smx_grammar_b2_path_units`: 54 gai ordenatuta (1–54); 9 modulu. Moduluen eta gaien atzerriko gakoak egiaztatuta.

### Frontend bateragarritasuna

`gramatika/ibilbidea/app.js` fitxan moduluen kopurua 7–12 artekoa onartzen da, eta `Modulua X/N` zein modulu-kopurua dinamikoki erakusten dira. `gramatika/ibilbidea/index.html` eta `sw.js` cache bertsio berriarekin argitaratuta. PR [#92](https://github.com/antoniourutz-dev/sustrai-irakurmena/pull/92) squash merge, `decb11793a3eb38b9377ee091d817274416a9b68`. Vercel ekoizpena `READY` eta aliasa commit horretan ikusia, datu-basea eguneratu ondoren.

### Supabaseko egiaztapena (2026-11-23)

- Gramatika-banku osoa **96 fitxa**, haietatik **54 B2** eta **42 C1** (beste lan paraleloetako C1 fitxak barne; ez dira zortzi honen ondorioz sortu).
- **93 fitxa irakurgarri**; 54 B2 ibilbideko gai, **51 ikasgai gidatu**, **204 praktika-item**, **20 diagnostiko**.
- **0** katalogorako esteka hautsi, **0** ikasgai gidatu osatu gabe (bakoitzean lau praktika), **0** modulu umezurtz.
- Zortzi fitxetan `status='draft'` eta `review_status='not_reviewed'`; pilotuko irakurketa-askatze erregistroaren `released_content_hash` eta fitxaren `current_content_hash` berdinak.
- Zortzi ikasgaiek lau trebetasunetako galdera bana; erantzun-aukera/feedback kopuruak egiaztatuta.
- Ez da baimen- edo RLS politika berririk sortu; aurretik zeuden ikasle/irakasle kontrolak mantendu.

## Oraindik egiaztatu beharrekoa

- [ ] Zortzi fitxen, 32 praktikaren eta 8 diagnostikoen **bigarren berrikuspen akademiko independentea**, eta izan daitezkeen ñabardura semantiko/estilistikoen egiaztapena.
- [ ] Benetako bi konturekin: ikaslearen lehen diagnostikoa, praktika, ekoizpen autonomoa, 72 ordu geroagoko berrikuspena, taldeko irakaslearen ikuspegia eta beste irakaslearen RLS sarbide-debekua.
- [ ] Mugikorreko QA, irisgarritasuna eta nabigazioaren/kontrastearen erabilgarritasuna.
- [ ] **198. arauaren benetako etzan/lodi erakustaldi bisuala** ikasgaian: gaurko jarduerak tipografiaren funtzioa azaltzen du, baina testu lauko azalpenak ez dira tipografia aplikatuaren ebidentzia.
- [ ] Driveko fitxa kanonikoen gordetzea eta irakurketaren egiaztapena; `google_drive_state='gordetzeko_zain'`.
- [ ] Hurrengo mailarako, C1/C2ko sakontzeak: aspektuaren konbinazio aurreratuak, subjuntibo/aginteraren erregistro-ñabardurak, 202. arauko puntuazio kasu konplexuak, 204. arauko izen berezien izendegi osoa. Ez sortu lehendik dauden C1 fitxen kopiarik.

### Ikusgarritasuna eta terminologia

Ikas-material pilotuak ez dira HABE/IVAPeko azterketa ofizialak. `draft` ez da `approved` bihurtu, eta kontsulta edo ariketa amaitzeak ez du frogatzen ikasleak gaitasun egonkorra lortu duenik. Akats arautua, onartutako aldaera eta estilo-erabakia bereizteko politika mantendu da.
