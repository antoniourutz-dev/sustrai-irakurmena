# Gramatika B2/C1 · Supabaseko datu-arkitektura

**Erabakia (2026-11-22):** Gramatika ataleko ikaslearentzako teoria *ez* da HTML/JS fitxategietan gordeko. Eduki editorialen jatorri operatiboa **Supabase Lexikoa** da. Webguneak soilik irakurtzen du; ikaslearen ariketak eta zuzenketa `/ariketak/` atalean jarraitzen dute.

## Lehendik dagoen eskema berrerabili

- `editorial_grammar_entries`: gaiaren ID iraunkorra (`id`), kodea, maila, kategoria, azalpenak, berrikuspena eta bertsioa
- `editorial_grammar_entry_sections`: azalpenaren atalak
- `editorial_grammar_forms`: forma zehatzak eta erabilera-baldintzak
- `editorial_grammar_entry_examples` eta `editorial_grammar_form_examples`: adibideak eta kontrasteak
- `editorial_grammar_form_contrasts`: egituren arteko ñabardurak
- `editorial_grammar_summary_tables`: taula pedagogikoak
- `editorial_grammar_error_patterns`: arriskuak eta zuzenketa-proposamenak

Frontendak `public_editorial_grammar_*` irakurketa-ikuspegiak erabiltzen ditu. `public_editorial_grammar_entries` ikuspegiak `published`, onartutako berrikuspena, `needs_review=false` eta bat datozen hash-ak eskatzen ditu; haren gainean oinarritutako ikuspegi osagarriek argitaratutako sarreren erregistroak bakarrik erakusten dituzte. Egiaztapen-data: **2026-11-22**. Abiapuntuan ikusgarri: **4 B2** eta **32 C1**; **C1 zirriborro 1** ezkutatuta. Kopuruak datu-basean aldatu daitezke.

## Datuak eta erakusteko arauak

1. **Edukia Supabasen editatu**, argitalpena berrikuspen akademikoaren prozesutik igaro ondoren.
2. Edizioak aurreko IDari eutsiko dio; ez bikoiztu baliabide bera izenburuaren aldaera dela eta.
3. Eraikuntza, adiera, erregistro, aldaera, erabilera-muga eta iturri mota bereizi. Deskribapena ez hartu debeku arauemailetzat.
4. `source_guideline` eremua jatorrizko erreferentzia editoriala da; **ez** aurkeztu Euskaltzaindiaren egiaztapen ofizial gisa.
5. Bertsio- eta berrikuspen-aztarna datu-basean gorde. Datu pertsonalik ez sartu teoria-sarreretan.
6. Ikuspegiak irakurketa hutsez erabili. Frontendak `textContent` erabiltzen du, HTML artifiziala ez exekutatzeko; ez erabili `service_role` nabigatzailean.
7. Zirriborroak eta egiaztatu gabeko unitateak ez dira ikasleen katalogoan agertzen; ikasleari ezin zaio azalpen egiaztatu baten itxura eman argitalpen-baimenik gabe.
8. `08_EZAGUTZA_BANKUAREN_KUDEAKETA.md` dokumentuko Markdown/Drive fitxa kanonikoen protokoloa **ez** da datu-migrazio automatikoa. Gorde kanpoko esportazioak, behar izanez gero, trazabilitaterako, baina ez sortu editatzeko bi jatorri independente.
9. Ez dago gramatikako edukiaren cache iraunkorrik nabigatzailean: PWAk UI fitxategiak gordetzen ditu, eta Supabaseko erantzunak sarean irakurtzen dira.

## Lehen faseko probak

- B2 eta C1 aukeratu, eta katalogoa itzuli dela egiaztatu, saioa hasi gabe zein erabiltzaile arruntarekin.
- Kategoria-iragazkia eta izenburuko bilaketa konprobatu.
- Gai bat ireki eta atal zein forma zehatzen xehetasunak kargatu.
- Adibide egokia eta hobetu beharrekoa **etiketa testualarekin** bereizi; ez hartu estilo hobea automatikoki arau-haustetzat.
- Aldez aurretik ikusgai ez dagoen zirriborro bat ez dela katalogoan eta APIko argitalpen-ikuspegietan azaltzen egiaztatu.
- Supabaseko sare-erantzuna huts eginda, errore argia azaldu, lekuko teoria faltsurik erakutsi gabe.
- Egiaztatu `/ariketak/` eta `/irakurmena/` ez direla aldatu.
- Azkenik, benetako gailuetan ikusmen/a11y proba eta egiaztapen akademiko independentea egin.

## Argitalpenerako hurrengo pausoak

1. Adibide eta arauen auditoria akademikoa, C1eko fitxa aberatsak B2ra egokitu aurretik.
2. B2ko edukien hedapena —gaur 4 sarrera ditu; C1ek 32—, lehendik dauden edukiak bikoiztu gabe.
3. Irakasle/administratzailearentzako edizio-fluxua berrikusi: sortu → berrikusi → onartu → argitaratu.
4. Egoerak eta bertsioak argitaratzean errespetatzen direla probatu.
