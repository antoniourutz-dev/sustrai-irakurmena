# SUSTRAI · C1 gramatika-bankua: -arazi, ebidentzialak eta subjuntiboa

**Data:** 2026-11-23  
**Bertsio didaktikoa:** 0.1.0 (pilotua)  
**Datu-gordailu kanonikoa:** Supabase, `editorial_grammar_entries` eta haren atal, forma eta adibideen tauletan  
**Barne-egoera:** `draft / not_reviewed`, `needs_review=true`. Katalogoaren irakurgarritasun pilotuak **ez** du egiaztapen akademikoa esan nahi.

## Bikoizketen kontrako bilaketa

B2ko hiru fitxa eta haien ikasgai gidatuak jada existitzen zirela ikusi da:
- `b2_adizki_trinkoak_dator_dabil_nago_dakit`;
- `b2_galdera_motak_al_ala_zer`;
- `b2_aditz_izenezko_osagarriak_tzea_tzen_tzera_tzeko`.

Horregatik, ez dira berriro sortu. C1erako hurrengo hutsuneak hautatu dira, baina lehendik zeuden B2ko `b2_modalizazioa_iritzia_eta_ziurtasuna` eta C1eko `helburuzko_perpausak` edukiak ere alderatu dira. C1eko fitxa berriek **esanahi/funtzio bereiziak** dituzte, ez B2ko azalpenen kopia.

## Fitxa berriak

| Kodea | Izenburua | Egiaztatutako iturriak | Hutsune espezifikoa |
|---|---|---|---|
| `c1_arazi_kausatiboa_23_43_arauak` | Arazi: kausatiboa, egilea eta kasu-erregimena | Euskaltzaindia, **23. araua (1994)** eta **43. araua (1995)**; *Euskararen Gramatika* (2021), § 23.2.1.2 | Arazlea NORK, eragindako pertsona NOR/NORI, oin-aditzaren araberako aldaketa eta arau historikoaren/hiztegiaren arteko ñabardura |
| `c1_omen_bide_ote_ebidentzialitatea` | Omen/ei, bide eta ote: informazioaren jatorria eta zalantza | *Euskararen Gramatika* (2021), § 23.5.3.2–23.5.3.5 | Beste bati entzundakoa (omen/ei), zeharkako inferentzia (bide) eta galderaren zalantza (ote); kokapena eta aldaera |
| `c1_subjuntiboa_dadin_dezan_agindua_helburua` | Subjuntiboa: dadin, dezan, zedin eta -n/-la | *Euskararen Gramatika* (2021), § 26.3.5.1 eta § 26.6.2.1; Euskaltzaindiaren **28. araua** | Subjuntiboaren morfologia, NOR/NOR-NORK, denbora eta eskaera/helburuko -n/-la menderagailuak |

### Jatorrizko dokumentuak (Drive, zuzenean irakurriak)

- [23. araua](https://drive.google.com/file/d/1MTfOJLuJ9XdMfkTpokjpsF5WFZrzJ53V/view)
- [43. araua](https://drive.google.com/file/d/1AfkxE5HtQB2Sb4JDag95emTD_thZ4TAN/view)
- [Euskararen Gramatika, I (2021)](https://drive.google.com/file/d/1XBGZDKFJrbXnGjb2Ggmh0L6wjQTN2GZ5/view)
- [28. araua](https://drive.google.com/file/d/1xYsareqIov_l8KoU14lnIpg6fRGPXlqB/view)

Arauemaileak eta gramatika **deskribatzailea** bereizi dira; arau historikoaren adibideez ezin da egungo hiztegiaren kontrako ondorio automatikorik atera. Zehazki, 23. arauan `sortarazi/agertarazi` eta `sorrarazi/agerrarazi` aldaerei emandako tratamenduaren ondoren, 2021eko gramatikak Euskaltzaindiaren Hiztegiko geroagoko hautuak aipatzen ditu. Horregatik ez da aldaera horietako bat automatikoki zigortzeko distraktorerik sortu.

## Benetako datu-basean egindakoa

- **3 fitxa** berri C1 mailan;
- **27 teoria-atal** (9 unitate bakoitzean);
- **12 egitura** (4 unitate bakoitzean);
- **24 adibide nagusi** eta **12 forma-adibide** original;
- `metadata.sources` barruan iturriaren izena, URL zehatza, atala, autoritate-mota eta kontsulta-data gordeta;
- `metadata.related_entry_codes` erreferentziekin lotu dira lehendik zeuden fitxa kanonikoak;
- `status='draft'`, `review_status='not_reviewed'`, `needs_review=true`; `sustrai_private.grammar_audit_release_entries` taulak irakurketa pilotua gaitzen du bertsio/hasharekin;
- hirurak `public_editorial_grammar_entries` ikuspegian egiaztatuta, eta haien `current_content_hash` / `released_content_hash` berdinak;
- ez da jatorrizko B2ko ibilbidea, ikasle-aurrerapena, esleipena edo adostutako gaitasun-proba aldatu;
- C1eko teoria katalogoan soilik gehitu da: **ez da praktikarik automatikoki gehitu gramatika-bankuan**, horretarako atal propioa baitago.

## Kalitate-arriskuak eta hurrengo ateak

- [ ] Beste irakurle euskaldun akademiko independente batek hiru unitateak berrikusi, bereziki *-arazi*ren argumentu-ereduak eta -n/-la subjuntiboaren erabilerak.
- [ ] Euskaltzaindiaren Hiztegiaren **uneko** sarrerak kontsultatu `sorrarazi`, `agerrarazi` eta aldaeren kasuan; 1994ko 23. arauaren eta 2021eko Gramatikako oharren artean dagoen bilakaera dokumentatu, epaia eman aurretik.
- [ ] Ahozko eta idatzizko benetako adibideak irakasle batek naturalitateari begira kontrastatu.
- [ ] C1eko katalogoa mugikorrean probatu; ikaslearen ikuspuntutik testuaren irakurgarritasuna eta nabigazioa baloratu.
- [ ] Ez erabili `approved` edo `egiaztatua` giza berrikuspenik gabe.
- [ ] Driveko fitxa kanonikoa aparte gordetzen bada, fitxategi-IDa/bertsioa/edukia berriz irakurri; oraingo metadatua `gordetzeko_zain` da.

**Egiletza eta eskubideak:** gramatika-dokumentuak irakurri eta arau eta esanahien sintesi **originala** egin da; ez da liburuen pasarte luze, taula edo ariketa-sorta kopiatu.
