# SUSTRAI · C1 gramatika: erregimena, ezezkoaren irismena eta menderakuntza konplexua

**Data:** 2026-11-23  
**Sorta:** `C1_ERREGIMENA_EZEZKOA_MENDERAKUNTZA_20261123`  
**Egoera akademikoa:** `draft / not_reviewed / needs_review=true` (ez da giza auditoria independenterik egin)  
**Hedapena:** katalogoko irakurketa piloturako egiaztatua; `grammar_audit_release_entries` taulako bertsio eta hash bidez  
**Egiletza:** SUSTRAIren azalpen, kontraste eta jarduera originalak

## 1. Hutsuneen analisia eta bikoizketen kontrola

Supabaseko `editorial_grammar_entries` bankua berrikusi da. Honakoak jada baziren:
- `c1_deitu_lagundu_erregimen_bikoitza`: 39. arauko erregimen bikoitzak.
- `c1_gonbidatu_iguriki_itxoin_itxaron_erregimena`: 39. arauko gainerako aditzen kasuak.
- `c1_arazi_kausatiboa_23_43_arauak`: kausatiboa eta argumentuak.
- `perpaus_osagarriak` eta `zehar_galderak`: mendeko perpaus motak.
- `c1_perpaus_luzeak_argitasuna_eta_zatiketa`: esaldi luzeen irakurgarritasuna.
- `b2_partitiboa_ik_ezezkoak_eta_galderak` eta `b2_hitz_ordena_argitasuna_eta_galdegaia`: B2ko oinarriak.

Gai horiek **ez** dira berriz sortu; harreman-kodeekin lotu dira. Fitxa berriak kontzeptu eta erabilera zehatzagoetarako dira.

## 2. Fitxak eta edukien diseinu pedagogikoa

| Fitxa-kodea | Izenburua | Ekarpen berria | Gaitasun-xedea |
|---|---|---|---|
| `c1_balentzia_alternantziak_adiera_eta_komunztadura` | Aditzaren balentzia-alternantziak: da, du, zaio eta dio | Poztu da/du, gogoratu da/du, azaldu du/dio: adiera, argumentuak, kasuak eta komunztadura | ZU-01 / ZU-02 |
| `c1_ezezkoaren_irismena_ukagaia_eta_kontrastea` | Ezezkoaren irismena: ukagaia, kontrastea eta esanahi-aldaketak | Gertaera osoa ukatzea ala ukagai zehatza; «ez A, B baizik»; «ez dira guztiak» / «ez da inor» | ZU-04 / KH-01 |
| `c1_menderakuntza_konplexua_mailak_eta_erreferenteak` | Menderakuntza konplexua: perpaus-mailak eta erreferente argiak | Perpaus osagarri baten barruko erlatibo, baldintza eta denborazkoak; ezezkoaren mailak, erreferentzia | ZU-03 / KH-02 |

**Sortutako edukiak:** 3 fitxa, 33 teoria-atal, 14 egitura, 24 adibide nagusi eta 18 forma-adibide. Unitate bakoitzaren metadatuetan hiruna diagnostiko/praktika-proposamen daude, soluzio eta feedbackarekin. Praktikaren metadatuak **ez dira** aplikazioko C1eko autozuzenketa interaktiboarekin nahastu behar: oraingoz ikasgaiaren diseinu-datuak dira.

**Didaktika:** hasierako diagnostikoa, azalpen arrazoitua, kontraste semantikoa, praktika gidatua, ekoizpen autonomoa eta 72 ordu geroko transferentzia. Ikaslearen erantzun zuzenak eta irakasle-balorazioak bereiztea gomendatzen da.

## 3. Zuzenean irakurritako Euskaltzaindiaren iturriak

1. [*Euskararen Gramatika*, I (2021)](https://drive.google.com/file/d/1XBGZDKFJrbXnGjb2Ggmh0L6wjQTN2GZ5/view) — §23.2.2.1 eta §23.2.2.7: argumentu-egitura eta balentzia-alternantziak; §22.9.3.7: bai eta ez.
2. [*Euskararen Gramatika*, II (2021)](https://drive.google.com/file/d/1enzVcbw0yN5ogcIRGFj-CpvASCOoxJbh/view) — §29.2, §30.5.1, §37.2.2 eta §41.3–41.4.3: perpaus osagarrien kokapena, ukagaiaren fokoa, kontrastea eta mendeko egiturak.
3. [39. araua, *Zenbait aditzen erregimena*](https://drive.google.com/file/d/16il4bPDq-WAzrCwFPyUh7_kFjRwh2V_t/view) — aditz berezien erregimen arautua, gainerako alternantzietara hedatu gabe.

**Epistemologia:** 39. araua arauemailea da; *Euskararen Gramatika* deskribatzailea. Iturri horiek gramatika-egiturak babesten dituzte, ez SUSTRAIren ikasleen emaitzak. Ikasgaietako adibideak eta ariketak originalak dira, eta haien naturalitatearen giza berrikuspena egiteke dago.

## 4. Kalitate-kontrolak

- [x] Aurrez bazeuden fitxen izenburuak, kodeak eta edukiaren funtzioa ikusi dira.
- [x] Fitxa berriek ID bakarrak eta lehendik zeuden gaiekiko erreferentzia-kodeak dituzte.
- [x] Egitura/adibide bakoitza bere fitxarekin erlazionatu da.
- [x] Bi hizkuntza-akats editorial zuzendu dira argitaratu aurretik: `Ane-k` → `Anek` eta `forma aislatuaren` → `forma bakartuaren`.
- [x] Fitxa guztiak zirriborro gisa gorde dira: ez dira `approved` edo `published` markatu.
- [x] Katalogoaren irakurketa pilotua `released_content_hash` eta `current_content_hash` parekatuta egiteko egiaztapena.
- [ ] Euskarazko gramatikan aditu independenteak egin beharreko berrikuspen itsua.
- [ ] Adibideen naturalitatearen proba, informazio-fokuaren eta erlatibo barruko subjektuaren kontrastean.
- [ ] Ikaslearen jarduera-datuen eta geroko transferentziaren baliozkotzea.
- [ ] C1eko ikasgai interaktiboetara ariketa-metadatuen integrazio teknikoa. Ez eman hau egintzat.
- [ ] Benetako ikasle- eta irakasle-kontuekin aplikazioaren erabilgarritasun-proba.
- [ ] Driveko Markdown gordailu kanonikoaren igoera eta irakurketa (oraingo egoera: `gordetzeko_zain`).

## 5. Argitaratze-egiaztapenaren muga

Supabasen `public_editorial_grammar_entries` ikuspegiaren bidez irakurgarri jartzeak ez du `editorial_grammar_entries.status` edo `review_status` aldatu behar. Bi prozesu bereizi dira: **irakurketa pilotua** eta **egiaztapen akademikoa**.

Edozein aldaketa linguistiko esanguratsuk hash/bertsio kontrola eta lotutako adibide zein ariketen berrikuspena behar ditu. Euskaltzaindiaren azalpen luzeak eta egile-eskubidedun corpuseko atalak ez dira kopiatu SUSTRAIren eduki bezala.
