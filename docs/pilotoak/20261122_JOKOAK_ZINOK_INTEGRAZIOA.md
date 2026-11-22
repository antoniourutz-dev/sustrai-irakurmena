# ZINOK · sei mailako bertsioa (2026-11-22)

## Jatorria eta edukia
- Jatorrizko biltegia: `antoniourutz-dev/zinok` (main).
- `src/data/synonyms.ts` fitxategiko **607 sinonimo-taldeak** erabili dira, jatorrizko sei etiketekin: **B1 (50), B2 (96), C1 (154), C2 (42), Expert/EX (132) eta Maisu/MA (133)**.
- Datuen kopia: `jokoak/zinok/data.js`. Jatorrizko `id` balio batzuk errepikatu egiten direnez, `uid` bakarra gehitu zaie inportazioan; hitz-zerrendak eta maila-etiketak ez dira aldatu.
- Lehen pilotuan egindako lau multzoko `synonimoak_2` kontsulta baztertu da: ez zen ZINOKen sei mailen banaketari zegokion.
- **Mezu Zuzentzailea** aukera kendu da, ikasleentzako orritik eta katalogotik. Bere ariketak ez dira kargatzen.
- Oraingo guneak: 10 galderako sei mailako erronka eta sei mailen hitz-bilatzailea. Datuak modu estatikoan daude; gonbidatuek ere jolastu dezakete.

## Kontuak eta segurtasuna
- `window.SustraiCloud` sistemaren bidez gordetzen dira amaitutako entrenamendu-saioak `sustrai-jokoak-zinok-v1` gakoan.
- Ez da kontu berririk sortzen; ez da Supabaseko SQL, eskema, RLS edo beste erabiltzaileen daturik aldatzen.
- Aurreko saiakeren erregistroak gordetzen dira, baina lehengo lau zenbakizko multzoak ez dira oraingo sei mailen parekotzat hartzen.

## Kalitate pedagogikoa
- Jatorrizko ZINOKen maila-etiketak errespetatzen dira, baina ez dira HABE/IVAP ziurtagiri ofizial edo egiaztapen akademikotzat aurkezten.
- Sinonimo-bikoteak ez dira nahitaez adiera, erregistro eta testuinguru guztietan trukagarriak.
- Erantzunaren egoera berdez/gorriz **eta testuz** adierazten da, eta huts egindako galderak saioaren amaieran erakusten dira.
- Datuak jatorrizkotik ekarri dira, baina **607 taldeen berrikuspen linguistiko sistematikoa ez da egin**; jolasaren gakoak proposamenak dira.

## Probak argitaratu aurretik
1. `node --test tests/jokoak-zinok.test.cjs` eta `node --check jokoak/zinok/{app,core,data}.js`.
2. Previewan sei mailak azaldu, bakoitzean 10 galdera ireki, zuzen/oker markak eta amaierako laburpena egiaztatu.
3. Bilatzailearen iragazketa probatu, eta `Mezu Zuzentzailea` aukera ez dela ageri baieztatu.
4. Saioa hasitako erabiltzailearekin eta gonbidatuarekin jokatu. Aurreko historia ezabatu gabe mantendu.
5. Mugikorreko diseinua, teklatua, irakurleak eta PWA cache-bertsioa egiaztatu.
6. Edukien auditoria akademikoa egin egiaztatutako prestakuntza gisa eskaini aurretik.

**Egoera:** integrazio-pilotuaren previewa; ez batu `main` adarrera berrikuspena amaitu aurretik.
