# SUSTRAI · Eduki pedagogikoaren argitalpen-erregistroa

**Data:** 2026-11-17  
**Erakundea:** IVAP · 3. HE / C1  
**Deialdia:** 2022-05-07  
**Trebetasuna:** Irakurmena  
**Egoera:** behin-behineko erabilera; giza auditoria akademiko independentea egiteke.

## Iturrien identifikazioa

- IVAPen «Examen euskera C1 IVAP 2022-05-07 idatzizkoa.pdf», Google Drive bidez kontsultatutako PDFaren testu-erauzketa.
- IVAPen «Examen euskera C1 IVAP 2022-05-07 soluciones.pdf», Google Drive bidez kontsultatutako erantzun ofizialak.
- Supabase Lexikoa-ko `sr_exams`, `sr_tasks`, `sr_task_versions`, `sr_items`, eta `sustrai_private.sr_answer_keys`.
- Azterketako testu-gorputza eta erantzunen transkripzioa zuzenean erkatu dira bi PDF horietatik jasotako testuarekin. Jatorrizko PDFaren orrialde guztien maketazio-ikuskapen bisuala **ez da egin**.

## Argitalpenaren irismena

- Galderak guztira: **25**; bi ariketa (5 ulermen-galdera eta 20 hutsune).
- Lehendik sortuak: **1–3** (1–2 argitaratuta; 3 zirriborroan).
- 2026-11-17an sortutako azalpen berriak: **21** (4–24, bi muturrak barne).
- Plataforman erabilgarri: **23/25**, hots, 1–2 eta 4–24. Guztiak `provisional` egoeran daude.
- Behin-behineko azalpenak **ez dira** erakundearen erantzun ofizialak; SUSTRAIren material osagarria dira.

## Argitaratu gabeko salbuespenak

- **3. galdera:** gako ofiziala B da, baina «behar besteko garrantzia» esamoldeak testuan frogatutako babes-neurria baino gehiago iradoki dezake. Erantzun ofiziala bere horretan uzten da; azalpenaren zirriborroa blokeatuta.
- **25. galdera:** D distraktorearen datu-eremuan `alderatuIdazmen-proba` ageri da; PDFaren testu-erauzketak ere izenburu berriaren muga ez du ongi bereizten. Testuaren **jatorrizko maketazioa bisualki egiaztatu arte**, ez zuzendu itemaren transkripzioa eta ez argitaratu azalpenik.

## Kontrol automatikoak

1. Azalpen bakoitzaren erantzun-argazkia (`accepted_options_snapshot`) eta erantzun ofiziala berdinak dira.
2. Aipatutako testu-zatia azterketan gordetako irakurgaian hitzez hitz agertzen da.
3. Distraktoreen kopurua, hizkiak eta erantzun zuzena elkarren artean koherenteak dira.
4. Azalpenak gutxieneko arrazoia, estrategia eta transferentzia-ariketa eskaintzen ditu.
5. `sr_explain_after_grade_v2` funtzioak 23 azalpen itzultzen ditu zerbitzu-rolarekin, eta ez dauka `anon` edo `authenticated` exekuzio-baimenik.
6. `sr-grade-exam` v6-k galdera erantzun eta **praktika moduan zuzendu ondoren** soilik erakusten ditu. Simulazioan ez.
7. JavaScriptaren sintaxi-egiaztapena egin da; Vercelen ekoizpeneko build-a `READY` da. Ez da nabigatzailean amaieratik amaierako proba automatizaturik egin.

## Hurrengo kalitate-atea

Euskal filologian edo C1 irakaskuntzan esperientzia duen beste irakasle batek azalpenen lagin osoa independenteki berrikustea, hasierako zirriborroak ikusi gabe. Ondoren, 3. eta 25. galderetako gorabeherak argitzea eta ikasleekin erabilgarritasun-proba egitea. Horiek egin arte ezin da `egiaztatutako_bertsioa` edo `giza_auditoria_gainditua` adierazi.
