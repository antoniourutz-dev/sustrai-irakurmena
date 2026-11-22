# SUSTRAI · Gramatikako irakurgailu integratua

**Data:** 2026-11-23  
**Eremua:** B2ko ibilbide gidatua, \`/gramatika/ibilbidea/\`  
**Helburua:** ikaslea ez behartzea teoriaren bila beste pantaila batera joatera.

## Diseinuaren erabakia

MarkText aplikazioko dokumentu-irakurketa garbia hartu da erreferentzia gisa:
testua lehen planoan, izenburu-maila argiak, paragrafo irakurgarriak,
marjina zabalak, barruko aurkibidea, letra-tamainaren kontrola eta
distrakziorik gabeko irakurketa-modua. Ez dugu MarkTexten kodea kopiatzen
ezta editore oso bat txertatzen ere: **irakurgailu pedagogiko segurua da**.

## Nola funtzionatzen du

- Edozein B2 gairen izenburua sakatuta, gaia ibilbidearen eskuineko
  irakurgailuan irekitzen da, betiko URL/parametroari eutsita.
- B2ko 31 gaietan, ikasleak teoria osoa ikusten du: azalpena,
  erabilera-baldintzak, atal eta azpiatalak, formak, adibideak,
  egituren kontrasteak, laburpen-taulak, nahasketak eta iturriak.
- Pilotu gidatuko gaiek lau urrats mantentzen dituzte:
  Ulertu (eduki osoa bertan), Kontrastatu (kontraste didaktikoa),
  Praktikatu (galdera arrazoituak), Erabili (ekoizpen autonomoa).
- Praktika osagarria eta erantzunen azalpenak bankuko ataletatik
  datorrenean, **tolesgarri** agertzen dira erantzunak nahi gabe
  aurreratzea saihesteko.
- Beste 23 gaietan, teoria osoa eta irakurri-markaren aukera ageri dira
  ibilbidean bertan. Ez dago «fitxa osora joan» esteka derrigorturik.
- Gramatika-bankua bere kabuz mantentzen da bilaketa librerako.

## Iturri bakarra

\`gramatika/ibilbidea/reader.js\` fitxategiak zazpi irakurketa-bista
publiko kontsultatzen ditu, \`entry_id\` bidez, behar denean bakarrik:

1. public_editorial_grammar_entry_sections
2. public_editorial_grammar_entry_examples
3. public_editorial_grammar_forms
4. public_editorial_grammar_form_examples
5. public_editorial_grammar_form_contrasts
6. public_editorial_grammar_summary_tables
7. public_editorial_grammar_error_patterns

Fitxaren \`public_editorial_grammar_entries\` erregistro nagusiak
azalpena, erabilera-oharrak, bertsioa eta iturriak eskaintzen ditu.
Kopiak ez dira Supabaseko taula berrietan gordetzen.
Karga asinkronoa da, saioan cachekatua, eta hutseginez gero berriro
saiatzeko aukera erakusten da. Gaia aldatutakoan, berandu heldutako
erantzuna ez da beste gai baten gainean marrazten.

## Tipografia eta irisgarritasuna

- Testu luzeak \`Sustrai Serif\` jatorrizko letra-tipoaz aurkezten dira,
  luzera kontrolatua, paragrafoen tarteak eta izenburuen hierarkia.
- Aurkibideak dokumentu berean nabigatzen du; ez ditu orriak aldatzen.
- «A− / A+» botoiek letra-tamaina 15–23 px tartean egokitzen dute.
- Irakurketa-moduak distrakzioak ezkutatzen ditu; Escape bidez irten.
- Ordenagailuan zein mugikorrean diseinu moldagarria.
- Screen reader batek ez du testu luze osoa \`aria-live\` gisa jaso.
- Urrats, aurrerapen eta ebaluazio-orientazioak mantentzen dira.
- Erabilera egokia / berrikusteko erabilera / beste aukera bereizita
  ageri dira, ez kolore hutsez.

## Segurtasuna eta kalitate akademikoa

- Supabaseko testua DOMeko \`textContent\` eta testu-nodoen bidez
  sortzen da; ez da HTML gordinik exekutatzen.
- Kanpo-iturriak \`https:\` URLekin soilik lotzen dira.
- Berrikuspen akademikoaren egoera ez da aldatzen.
- Honek ez du ekarriko kalifikazio ofizialik edo gaitasunaren
  gainditze-etiketa automatikorik.
- Gramatika-bankuko jatorrizko fitxak ez dira aldatu.

## Proba-ateak

**Automatizatuak:** JavaScript sintaxia; zazpi iturrien karga;
edukiaren zuzeneko marrazketa; HTML injekzioa baztertzea;
erroretik berreskuratzea; 31 gaietako integrazioa; tresnen eta
PWA baliabideen egiaztapena.

**Eskuz egiteko:** benetako nabigatzailean mahaigaineko eta
mugikorreko ikuskapen bisuala, bi erabiltzaile autentifikaturekin
datuen jarraipena, teklatu hutsezko nabigazioa, letra-tamaina
handiak eta testu-luzeen erabilgarritasuna.

Testu-diseinu berriak ez ditu auditoriaren edo pilotuko benetako
ikaskuntza-ebidentziaren baldintzak ordezten.
