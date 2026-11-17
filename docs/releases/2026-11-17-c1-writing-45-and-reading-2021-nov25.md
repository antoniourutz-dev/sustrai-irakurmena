# SUSTRAI MAX · 2026-11-17 · Idazmena cobertura básica + Irakurmena IVAP 2021-11-06

## Alcance y evidencia comprobada

**Lote terminado:** el catálogo publicado en `sr_writing_prompts` contiene **45 tareas**, y **45/45** tienen los tres tipos de apoyo `planning`, `lexicon` y `structures` en `sr_writing_supports` con estado `published`. Esto es **cobertura básica de apoyos**, no validación humana ni demostración de eficacia didáctica. Se mantienen separados el enunciado de la institución y los apoyos originales de SUSTRAI.

Los últimos bloques de escritura verificados fueron:
- IVAP 2019/05/04 · Carta sobre propuestas de mejora del servicio y artículo sobre eutanasia. [Original](https://drive.google.com/file/d/1VjZS5XoJKJ5YPNivr6K3ezHR1oOG3cAg/view).
- IVAP 2019/10/26 · Carta sobre medidas municipales anticontaminación y artículo sobre privacidad laboral. [Original](https://drive.google.com/file/d/1-3ottbmcKhkJFxwyiavNBg46ae3kUXAq/view).
- IVAP 2021/04/24 · Artículo sobre ocupación de viviendas y presión vecinal. [Original](https://drive.google.com/file/d/1JRDlJa4_kK33HDRQFM5mTJGvfjMO434g/view).
- **2023/10/28 eredu moldatua** · Artículo sobre absentismo en el empleo público. La fuente está marcada **moldatua**, por lo que no se presenta como transcripción íntegra de una prueba original institucional. [Fuente adaptada](https://drive.google.com/file/d/10ZkEq0-bZLk4NlbJvWC-iqXhjfSqNVmi/view).

Para esos 6 apoyos finales: **6 tareas × 22 recursos = 132** entradas asociadas; tres campos de ayuda por tarea, etiquetados en euskera como **behin-behineko** y **giza auditoria akademiko independentea egiteke**. El examen de 2019/05 tuvo apoyos `draft` existentes al inicio del procesamiento y se reutilizaron sin duplicarlos. Todos los publicados se verificaron por cantidad, campos, clave de género, fuente y etiqueta no oficial. Los PDF se comprobaron por extracción de texto, no por inspección visual formal de cada página.

## Irakurmena · IVAP 2021-11-06 · A eredua

**Fuente exacta:** [Examen de 6 de noviembre de 2021, páginas de irakurmena y clave oficial al final](https://drive.google.com/file/d/1bIMEixMqAHybLlhNEk2lFohB-mjdCyzw/view).

- `sr_exams.slug = ivap-2021-11-06`
- Task 1: «Lehia, garapenaren gainetik», ítems **1–5**.
- Task 2: «Hiriaren oinarri berriak», huecos **6–25**.
- **25/25** `sustrai_private.sr_item_explanation_reviews` con `review_status='provisional'` y `published_at`.
- Para cada item se ha comprobado: opción aceptada de `sr_answer_keys` concordante con la clave oficial que figura en PDF; pasaje citado contenido literalmente en `sr_task_versions.passage_text`; hash `md5:` concordante; explicación de todas las opciones distractoras, etiquetas sin duplicados, estrategia lectora y nueva tarea de transferencia.
- Comprobación funcional del servicio: `SELECT count(*) FROM public.sr_explain_after_grade_v2('ivap-2021-11-06');` → **25**.
- La atribución de las explicaciones es **SUSTRAI, no institución IVAP**; no se han emitido calificaciones ni se afirma auditoría docente independiente.
- Los ítems de completar huecos justifican el significado en la oración, no solo la posibilidad de existencia de la palabra aislada.
- El ítem **4** requiere atención adicional del auditor humano porque el distractor B menciona una función parcialmente cercana (políticas públicas), aunque la opción C es la establecida en la clave oficial y mejor recoge el ámbito de reclamaciones y sanciones.
- **Limitación de revisión documental**: original y clave cotejados mediante extracción textual de Drive; no declarar cotejo visual completo del PDF.
- No se ejecutaron pruebas E2E de navegador real ni pruebas de accesibilidad con estudiantes.

## Inventario verificado al cerrar

| Dimensión | Cobertura registrada |
| --- | --- |
| Idazmena | **45/45** tareas con planificación, léxico y estructuras |
| Irakurmena | **32** exámenes publicados y **962** ítems |
| Irakurmena con explicación publicada | **72/962**, es decir, **890** pendientes |
| IVAP 2021-11-06 | **25/25** explicaciones provisionales |
| Ahozkoa | **53** tareas publicadas con apoyos básicos preexistentes (no implica auditoría independiente) |

## Pendientes bloqueantes para «calidad acreditada»

1. **Revisión humana independiente** de los modelos de euskera y naturalidad contextual, con distinción de error normativo, uso válido y estilo, registro y propósito.
2. **E2E práctica/simulación**: verificar que las explicaciones de lectura solo aparecen después de corregir respuestas y que las ayudas no aparecen durante simulación. Hacer pruebas teclado, lector de pantalla y móvil.
3. **Eficacia didáctica real**: producción autónoma antes/después y transferencia, no inventar mejoras ni notas.
4. **Ampliar irakurmena** siguiendo la prioridad del inventario SQL; todavía faltan **890/962** explicaciones y quedan exámenes incompletos.
5. **Protección de clave oficial**: mantener keys y explicaciones tras calificación fuera de endpoints públicos antes de contestar.

**Conclusión limitada:** primera capa de idazmena cubierta y examen de lectura del 6/11/2021 explicado; el proyecto no está terminado ni auditado integralmente.
