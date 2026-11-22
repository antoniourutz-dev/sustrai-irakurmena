# B2ko ikasketa-ibilbide gidatua · lehen pilotua

**Data:** 2026-11-22 · **Bidea:** /gramatika/ibilbidea/
**Egoera:** pilotu teknikoa; benetako ikasle- eta irakasle-kontuekin eskuzko QA pendiente

## 1. Xedea eta ibilbidea

Gramatika-banku editoriala eta ikasketa-ibilbide gidatua bereizi.
Azalpen gramatikalen iturri bakarra Supabaseko gramatika-bankua da; ez dira
testu beraren kopiak egiten. Ibilbideko unitateek editorial_grammar_entries.code
erreferentziatzen dute.

Zazpi moduluak:
1. Perpausaren oinarriak — 5 unitate, pilotua aktibo
2. Kasuak eta kantitateak — 3 unitate
3. Perpausen osagarriak — 3 unitate
4. Mendeko perpausak — 6 unitate
5. Argudiatzea eta loturak — 6 unitate
6. Testuaren kohesioa — 5 unitate
7. Egokitasuna eta puntuazioa — 3 unitate

**Guztira:** 31 gai, kode bikoizturik gabe. Hurrenkera didaktikoa da,
ez HABEren edo IVAPen zerrenda ofiziala.

Lehen moduluko 5ak: subjektua eta aditza; subjektua eta predikatua;
ergatiboa eta absolutiboa; NOR/NOR-NORK; NORI eta datiboa.

## 2. Lau urratsak

1. Ulertu — Supabaseko azalpena irakurri.
2. Kontrastatu — Supabaseko adibideak eta ñabardurak aztertu.
3. Praktikatu — bi aukera-galdera sintetiko eta azalpen orientagarria.
4. Erabili — ekoizpen propioa idatzi eta kontuarekin gorde.

Ikasleak egindako urratsak ikasteko jarraipena dira, ez kalifikazio ofizialak.
Beste 26 gaietan, une honetan, kontsulta eta irakurketa markatzea daude.

## 3. Supabaseko datu-eredua eta baimenak

Proiektua: awdajwrzxceqazmaorxc.

- smx_grammar_b2_modules: moduluen izenak eta helburuak.
- smx_grammar_b2_path_units: 31 fitxen hurrenkera eta pilotu-marka.
- smx_grammar_b2_progress: erabiltzailearen lau urratsak eta ekoizpen idatzia.
- smx_grammar_b2_assignments: taldeka esleitutako moduluak edo gaiak.

Lau taulek RLS aktiboa dute. Progresua erabiltzaileak bakarrik idatzi dezake;
talde bereko irakasle baimenduak irakur dezake, sr_teaches eta sr_is_teacher
egiaztapenekin. Esleipenak sr_owns_group bidez babesten dira.
Konturik gabe teoria ikus daiteke; gordetzeko saio autentifikatua behar da.
Nabigatzaileak ez du service_role giltzarik.

Aurreko sr_groups, sr_group_members, sr_teacher_overview, sr_join_group eta
sr_my_groups mekanismoak berrerabili dira. Lehendik zegoen smx_assignments
ez da ukitu: hark activity_version_id du, ez gramatika-gaia.

## 4. Akademia-gobernantza

2026-11-22ko unean 31 B2ko fitxatik 4 onartuta daude eta beste 27
berrikuspen akademikoaren zain. review_snapshot argazkia da,
ez eguneraketa automatikoa; interfazean egoera horren data ageri da.
Erabilera zilegiak eta hautu estilistikoak ez dira automatikoki arau-akats.
Ez adierazi jarduera orientagarri batek gaitasun osoa ziurtatzen duenik.

## 5. Probak

SQL bidez egiaztatuta: 7 modulu, 31 kode erreal, 5 pilotu aktibo,
0 kode ikusezin, 4/4 RLS, eta anon rolarentzat progresu/esleipenen
SELECT baimenik ez. HTML/JS egiaztapen estatikoak egin dira;
frontendak gramatika-bankuko ikuspegiak erabiltzen ditu.

**Eskuz egiaztatu gabe:** mugikorreko QA; benetako ikaslearen jarduera
osoaren gordetzea eta beste gailuan berreskuratzea; irakaslearen talde-sorkuntza,
kodearekin bat egitea eta esleipenaren jarraipena, bi erabiltzaile desberdinekin;
PWA cache zaharraren integrazio-proba eta berrikuspen akademiko independentea.
Ez da halako proba egin dela asmatu.
