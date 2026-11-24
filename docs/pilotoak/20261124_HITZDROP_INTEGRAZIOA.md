# HITZ-DROP · integrazio-pilotua (2026-11-24)

## Helburua
HitzBira-ren /jokoak/ atalera euskarazko hitz-eratorpenaren arcade-jokoa gehitzea.
Ez ordezkatu dagoen gurutzegrama, TEUSK, ZINOK edo MINTZAKATS.

## Hasierako jokagarritasuna
- 5 × 6 pieza; hasierako moduan elkarren ondoko bi pieza aukeratu/arrastatu.
- Hitzak **jokalariak** eratzen ditu. Erortzeak ez du automatikoki hitzik osatzen edo misiorik amaitzen.
- 180 segundoko partida, erlojua lehen mugimenduan abian; 12 konbinazio / 8 hitz desberdin / 3 aurrizkidun erronkak.
- Erronkak garaiz gaindituta ere, partida denbora bukatu arte jarraitzen du.
- Katalogo egiaztatugabeko konbinazioari ez zaio "arau-akats" etiketa eman; jokoan katalogoan ez dela agertzen azaltzen da.
- Aurrizkiak eta atzizkiak nahastuta, gutxienez 2 aurrizki-konbinazio eta 3 atzizki-konbinazio eskuragarri izateko txertatze-pilotu bat.
- Animazioak, partikula-efektuak, pistak, nahasketa, pausa, soinu aukerakoa eta mugimendu-murrizketa hobespena.
- Sesioaren puntuazioa entretenimendurako da, ez hizkuntza-gaitasunaren edo azterketa ofizialaren neurketa.

## Lexikoa eta jatorria
- jokoak/hitzdrop/catalog.js-ek ez du hitz-bikote finkorik gordetzen. Supabaseko hitzak deskargatu eta afixo ezagunen segmentazioz **eratorpen-hautagaiak** kalkulatzen ditu. Segmentazioak ez du eratorpenaren zuzentasuna automatikoki frogatzen.
- Supabase Lexikoa (lexiko_sarrerak, sustrai_aditz_definizioak, lexical_words/lexical_groups eta lexiko_entries) **irakurri soilik** egiten da. Oinarriak eta emaitza-formak biak iturrien barruan egon behar dira. Etiketa editorial murriztaileak iragazten dira. 13 atzizki eta 5 aurrizki grafiko bilatzen dira pilotu honetan.
- Lema bankuan egoteak **ez du** automatikoki eratorpen-lotura onartzen. Katalogoko harreman berriek needs_morphological_review egoera dute; hau ez da ikasleentzako zuzenketa akademiko ofiziala. Halako onarpena iturri akademikoarekin eta berrikuspenarekin egin behar da.
- Datuen kontsultak huts egiten badu, aurreko Supabase deskargaren 7 eguneko cache lokala erabiltzen da, baldin badago. Lehen aldiz konexiorik gabe ezin da jolastu; ez da zerrenda finko artifizialik erakusten.
- Ez da SQL migraketarik, RLS aldaketarik, service_role erabilerarik edo ikasleen eduki pribatuen esportaziorik egin.
- Jokoaren marka pertsonala SustraiCloud.storage bidez gordetzeko saiakera egiten da; gonbidatuen kasuan tokiko biltegiratzea erabiltzen da.
- Ez dago ranking publiko/konpetitiborik: bezeroan kalkulatutako puntuazioak ezin dira fidagarritasun egiaztagiritzat hartu.

## QA egiteko (ez baliozkotzat jo probatu gabe)
- [ ] /jokoak/-tik sartu, eta lehengo lau jokoen estekak probatu.
- [ ] Jokoa saiorik gabe hasi eta amaitu; Supabase erabilgarri dagoen/ez dagoen bi egoerak.
- [ ] Zenbat lema eta zenbat eratorpen-hautagai deskargatu diren benetan begiratu, baita aurrizkien eta atzizkien kopuruak ere.
- [ ] 1.000 errenkadako API muga gainditzeko orrialdekatzea egiaztatu; ez utzi erregistroak galduta.
- [ ] Erabili ezineko hitzak (ez_erabili_jokoan, ez argitaratu) kanpoan geratzen direla frogatu.
- [ ] Hautagaien artean hitz homografoak, zatiketa okerrak eta eratorpen desegokiak banaka aztertu.
- [ ] Hasi jokoa: lehen klikaren ondoren erlojuak aurrera egin behar du.
- [ ] Bi pieza egoki elkartu; biak desagertu eta berriak **erori** behar dira.
- [ ] Piezak erortzeak ez du bere kabuz puntu, hitz edo aurrizki-zenbaketarik handitu behar.
- [ ] Une oro aurrizki-aukera eta atzizki-aukera erabilgarriak begiratu.
- [ ] Hiru misioak beteta ere partida ez amaitu, erlojua 00:00ra iritsi arte.
- [ ] Pista, nahasketa, pausa/berrartzea, soinua eta berriro jokatzea probatu.
- [ ] iPhone Safari, Android Chrome, mahaigaineko nabigatzaile, teklatu eta pantaila txikietan probatu.
- [ ] PWA-ren cache-bertsio berria, lineaz kanpoko atzera-bidea eta fitxategi berriak probatu.
- [ ] Akademikoki berrikusi aurrizki/atzizki hautagaien harreman bakoitza; aldaerak eta morfema-mugak argitu.

## Hurrengo urratsak
1. Kontuan hartu ikaslearen jokagarritasun-probak; aurkitu benetan dibertigarriak diren mugimenduak.
2. Deribazio-harremanak Supabaseko taula editagarri eta auditagarri batean normalizatu, proposatu / berrikusi / onartu egoerekin eta iturriekin.
3. Mailaka eta euskalki/erregistroen arabera gehiago hedatu; ez esan afixo guztien estaldura lortu dela korpus osoa egiaztatu gabe.
4. Gaitasun linguistikoa frogatzeko, asmaturiko hitzak erabilera-testuinguru autonomo berrietan berreskuratu.
