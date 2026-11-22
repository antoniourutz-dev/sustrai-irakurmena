# Gurutzegramak · 001 · Osasuna

**Egoera:** pilotu teknikoa · **Interfazea:** HitzBira / Jokoak · **Deialdia:** ez da azterketa ofiziala.

## Edukia eta jatorria
- 12 sarrera bakunak, Oposik Supabase proiektuko osasun_entries eta osasun_evidence bankuetan banan-banan egiaztatuak 2026-11-22an, ondoko kodeekin:
  OS-C013, OS-C023, OS-C014, OS-C020, OS-C055, OS-C081, OS-C060, OS-C019, OS-C001, OS-C015, OS-C003, OS-C058.
- 12 terminoek euskarazko definizioa, jatorrizko banakako ebidentzia-erregistroa eta editorial_state dokumentala dute; horrek **ez du** jokoa akademikoki baliozkotzen.
- Pistak eta azalpen pedagogikoak joko honetarako berridatzitako esaldi originalak dira; kanpoko lan baten testu osoa ez da kopiatu.
- «C1 · pilotua» orientazio didaktikoaren etiketa da, ez HEOC/HABE/IVAP maila-kalibrazioaren emaitza.
- Behin betiko argitalpena baino lehen, kanpoko bigarren berrikusle batek pistak, adierak, erantzun bakartasuna, alternatibak, naturaltasuna eta ortografia egiaztatu beharko ditu.

## Diseinua eta motorraren baldintzak
- Aurrez sortutako eta egiaztatutako **12×13** taula; **12 hitz** eta **13 gurutzaketa bateragarri**.
- Letra bana gelaxka bakoitzean; TX = bi gelaxka. Hitz bakunak bakarrik lehen pilotuan.
- Hitza hautatu gelaxkaren bidez edo pistaren bidez; erantzuna testu-eremuan idatzi. Enter sakatuta egiaztatzen da.
- Koloreez gain, ✓ / × eta azalpen testuala. Okerreko hitzaren hizki zuzenak berdez, okerrak gorriz.
- Pista bakoitzak hizki bat baino ez du argitzen. Erantzun zuzenak azalpen osagarria eta iturri-kodea erakusten ditu.
- Aurrerapena SustraiCloud.storage bidez gordetzen da; konturik gabeko saioa lokalean geratzen da.
- Ez dago erabiltzaile-datuen taula berririk, ezta datu-sarrera kliniko edo pertsonalik ere.

## Tokiko proba automatikoa

Exekutatu proiektuaren erroan: node jokoak/gurutzegramak/test-core.cjs

Probak: JS sintaxia, hitzen bakartasuna eta posizioa, 13 gurutzaketen letra-bateragarritasuna, sarearen konektibitatea, erantzun oker/zuzenaren feedbacka, pista, 12 hitzen amaiera eta berrabiaraztea.

## Benetako nabigatzaileko probak (egiteke)
- [ ] Mahaigaineko Chrome/Edge: taula, focus, sagua, teklatua, Enter eta errore-mezuak
- [ ] iOS Safari eta Android Chrome: 320 px-tik aurrerako pantailak, scroll horizontala, teklatu birtuala
- [ ] Gonbidatua eta kontuarekin: saioa gorde/berreskuratu gailuen artean, pribatutasuna
- [ ] PWA: cache bertsio berria, lineaz kanpoko hasiera eta eguneratzea
- [ ] Ikusgaitasuna: letra-tamainak, kontrastea, tekla bidezko nabigazioa eta pantaila-irakurgailua
- [ ] Akademikoa: bigarren berrikusle independenteak 12 pista eta 12 azalpenak ebaluatu

**Ez fusio automatikoa produkziora:** proba horiek eta edukien berrikuspena behar dira.
