# SUSTRAI MAX · 2026-11-17 · Cobertura académica y ampliación Idazmena (lote 04)

## Criterio de medición

Esta auditoría separa **contenidos publicados**, **apoyos didácticos** y **revisión académica independiente**. Los porcentajes se refieren solo a recursos ya cargados en Supabase; no al currículo completo B2/C1/C2 ni a todos los exámenes publicados históricamente por HABE/IVAP.

El inventario SQL inicial constató:
- **Irakurmena:** 32 exámenes publicados, **962** ítems, **47** explicaciones `provisional`; **915** sin explicación publicada.
- **Idazmena:** **45** consignas publicadas, **10** con los tres tipos de ayuda `planning`, `lexicon`, `structures`; **35** sin el conjunto completo.
- **Ahozkoa:** **53** consignas publicadas, **53** con ayudas básicas (tres en monólogo, cuatro en interacción). **El mero número no certifica calidad lingüística o eficacia didáctica.**

## Alcance de la ampliación de hoy

Se reabrieron los PDFs exactos de **IVAP 2012/1, 2012/2, 2013/1, 2013/2, 2020-09-19 y 2021-11-06** desde el Drive conectado, además de contrastar los enunciados y guías ya almacenados en `sr_writing_prompts`.

| Slug / título resumido | Género | Fuente oficial | Planificación | Léxico | Estructuras |
| --- | --- | --- | ---: | ---: | ---: |
| `ivap-2012-1-idazmena-1` Permiso tras jornadas de trabajo | `gutuna` | [IVAP 2012/1](https://drive.google.com/file/d/1sW5FKwnn3rUQA7GX3qRVkCRcGq_m0cS3/view) | 7 | 8 | 7 |
| `ivap-2012-1-idazmena-2` Gure gazteen aisialdia | `iritzi_artikulua` | [IVAP 2012/1](https://drive.google.com/file/d/1sW5FKwnn3rUQA7GX3qRVkCRcGq_m0cS3/view) | 7 | 8 | 7 |
| `ivap-2012-2-idazmena-2` Kirola arnasbidea da? | `iritzi_artikulua` | [IVAP 2012/2](https://drive.google.com/file/d/1ToC4qVGcyj1TubqH-4lvBkAuqiSoArnU/view) | 7 | 8 | 7 |
| `ivap-2013-1-idazmena-1` Lanaldi-murrizketa eskatzeko gutuna | `gutuna` | [IVAP 2013/1](https://drive.google.com/file/d/1HXsOSeWWbr_-Txe8oP-MO5MhqWP0Cems/view) | 7 | 8 | 7 |
| `ivap-2013-1-idazmena-2` Krisialditik irtengo ote gara? | `iritzi_artikulua` | [IVAP 2013/1](https://drive.google.com/file/d/1HXsOSeWWbr_-Txe8oP-MO5MhqWP0Cems/view) | 7 | 8 | 7 |
| `ivap-2013-2-idazmena-1` Euskararen Egunerako baliabideak | `gutuna` | [IVAP 2013/2](https://drive.google.com/file/d/11c0QSdA0hk_wwXaY5yLo_rFZPQsoVubd/view) | 7 | 8 | 7 |
| `ivap-2013-2-idazmena-2` Zer kontsumo mota egiten dugu? | `iritzi_artikulua` | [IVAP 2013/2](https://drive.google.com/file/d/11c0QSdA0hk_wwXaY5yLo_rFZPQsoVubd/view) | 7 | 8 | 7 |
| `ivap-2020-09-19-idazmena` Nola egin diezaiokegu aurre arrazakeriari? | `iritzi_artikulua` | [IVAP 2020](https://drive.google.com/file/d/11OO49EFObIga6jqRw4LwBaTN9E0S45SA/view) | 7 | 8 | 7 |
| `ivap-2021-11-06-idazmena` Zer egin janaria zaborretara ez botatzeko? | `iritzi_artikulua` | [IVAP 2021](https://drive.google.com/file/d/1bIMEixMqAHybLlhNEk2lFohB-mjdCyzw/view) | 7 | 8 | 7 |
| **TOTALES** | **9 tareas** | **6 PDFs** | **63** | **72** | **63** |

**Resultado de la ampliación:** **9 tareas completas por tipos de apoyo**, 27 filas `sr_writing_supports` y **198** entradas nuevas. Todas las filas son `is_official=false`, `publication_status='published'`, con `source_note` que dice expresamente **`behin-behineko`**. Los ejemplos son originales de SUSTRAI, no enunciados ni modelos institucionales.

## Corrección documentada de la fuente digitalizada

**IVAP 2013/1, artículo «Krisialditik irtengo ote gara? Noren bizkarretik?»**

Al cotejar el PDF se observó que el campo `sr_writing_prompts.exam_guidance` omitía el comienzo de dos preguntas. Se restablecieron **exactamente las preguntas del PDF**, incluida la referida a la decisión del hijo o hija de marcharse por falta de trabajo, y la pregunta sobre la actuación de los políticos y la Administración. El campo `metadata.transcription_correction_2026_11_17` guarda las versiones anteriores, el motivo y la referencia al original (pág. 9). No se alteró el contenido oficial.

## Controles

- **12/12 PASS** para los cuatro primeros temas (2012/1, 2020, 2021); cantidad, fuente, género, tres tipos de ayuda, integridad de campos, ausencia de etiquetas repetidas y estado `draft` verificados antes de publicación.
- **15/15 controles de integridad** para el segundo conjunto (2012/2, 2013/1 y 2013/2), incluyendo subsanación de un campo de explicación demasiado escueto.
- La publicación de las 27 filas se realizó después de comprobar precondiciones y número de entradas. La base de datos confirmó **22** entradas por unidad, **198** en total.
- El frontend de idazmena ya carga `published` y elige la última versión por tipo de ayuda; no se han modificado archivos de la interfaz en este lote.
- El acceso de práctica/simulación se mantiene según la implementación existente. **Prueba E2E de navegador real no ejecutada** y tampoco evaluación de accesibilidad con usuarios.
- Las cifras de los PDFs de 2013, 2020 y 2021 se tratan como datos/textos históricos de un examen, **no** como estadísticas verificadas hoy.
- No se ha asignado ninguna nota, nivel individual ni eficacia estimada sin evidencia.
- **Auditoría independiente humana: pendiente**; no se declara `APTO` académico.

## Cobertura tras este lote

- **Idazmena: 19/45** tareas con los tres tipos de ayuda (antes 10/45). **Quedan 26** tareas sin tríada de ayudas.
- **Irakurmena: 47/962** explicaciones publicadas; permanecen **915** sin explicación.
- **Ahozkoa: 53/53** tareas con ayudas básicas existentes; pendiente auditoría de naturalidad, variedad, ergonomía y transferencia.

Inventario actualizable: [SQL de cobertura](../qa/sustrai_material_coverage_20261117.sql).

## Próximas puertas de calidad

1. Continuar idazmena en bloques por examen (2014/1 y 2014/2, 2015, 2016, 2017, 2018, 2019, 2021/2023), **leyendo cada fuente** antes de autoría y diferenciando `gutuna` de `iritzi_artikulua`.
2. Escalar irakurmena por preguntas con comprobación de clave oficial y fuente, y retener como `draft` las alternativas que no se puedan justificar inequívocamente.
3. Auditar las 53 tareas orales ya dotadas de ayuda, incluyendo dinámica de interacción y variaciones defendibles.
4. Revisión lingüística humana independiente (errores normativos, usos correctos, opciones estilísticas); verificación con estudiantes reales y navegación E2E de práctica/simulación.
5. Solo tras auditoría y prueba podrán considerarse `APTO` las unidades y medirse progresos reales.

**Alcance real:** esto es un avance verificado de contenido básico, no la cobertura total de SUSTRAI MAX.
