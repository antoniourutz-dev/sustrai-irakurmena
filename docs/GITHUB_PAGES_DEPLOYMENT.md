# SUSTRAI — GitHub Pages argitalpena

SUSTRAI Vercelen dagoen bezala mantentzen da. GitHub Pages argitalpen alternatiboa da,
GitHub Actions erabiliz eta proiektuaren azpibideari egokituta.

**Helbide aurreikusia** (Pages aktibatuta eta lana READY badago):
https://antoniourutz-dev.github.io/sustrai-irakurmena/

## Zergatik behar da build-egokitzapena?

Iturburuak '/' erroko bideak erabiltzen ditu (adibidez '/gramatika/').
GitHub Pageseko proiektu-webguneak '/sustrai-irakurmena/' azpibidean argitaratzen dira.
'scripts/build-github-pages.mjs' scriptak **argitaratutako kopiako**
barneko bide absolutuak egokitzen ditu; iturburuko fitxategiak ez ditu aldatzen.

Buildak HTML, CSS, JS, webmanifest, JSON eta irudi/font fitxategi estatikoak
bakarrik argitaratzen ditu. Ez ditu argitaratzen '.github', 'docs', 'sql',
'supabase', 'tests', 'scripts' edo garapenerako konfigurazio-fitxategiak.

## Pages aktibatzeko ekintza (biltegiko administratzaileak)

1. Ireki https://github.com/antoniourutz-dev/sustrai-irakurmena/settings/pages
2. **Build and deployment → Source → GitHub Actions** aukeratu.
3. Ireki https://github.com/antoniourutz-dev/sustrai-irakurmena/actions/workflows/github-pages.yml
   eta egiaztatu azken exekuzioa.
4. Proba egin mugikorrean, ikasle-kontuarekin eta irakasle-kontuarekin.

GitHub Actions lanak automatikoki berrargitaratzen du webgunea main adarra
aldatzen denean. Pull request batean builda bakarrik egiten du.

## Supabase Authentication

Supabaseko helbideak eta gako publikoa lehendik dauden berberak dira.
Egiazko email-confirmation/password-recovery fluxuak GitHub Pagesen erabiltzeko,
baimendutako redirect URLen zerrendan ondoko helbidea gehitu behar da:

https://antoniourutz-dev.github.io/sustrai-irakurmena/**

Egiaztatu Supabase Authen (URL Configuration → Redirect URLs) eta kontu
errealekin probatu. Ez gehitu service-role edo secret gakorik bezeroan.
RLS indarrean egon behar da beti.

## Argitalpenaren mugak

- GitHub Pagesek fitxategi estatikoak bakarrik zerbitzatzen ditu.
  Supabaseko APIa behar da login, aurrerapenak, ariketak eta irakaslearen esleipenak kargatzeko.
- Orain arte ez da baieztatu GitHub Pageseko domeinua bizirik dagoenik.
- GitHub Actionsen build-probak ez dira saio errealen E2E proben ordezko.
- Edozein arazo bada, Vercelgo webgunea ez da lan honen ondorioz aldatzen.
