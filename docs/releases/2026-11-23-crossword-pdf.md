# Exportación de crucigramas a PDF

Solicitud: descargar el crucigrama actual con el mismo diseño, en versión para alumno
y profesor, y publicar la funcionalidad técnica. Base revisada: `8fbc59b`.

## Cambio

Dos botones en cada partida de `/jokoak/gurutzegramak/`. Se clona el componente real,
incluida su cuadrícula y sus pistas, y se reutilizan los estilos y fuentes de la app.
Se retiran controles y estados transitorios. El PDF de alumno tiene todas las casillas
vacías; el de profesor muestra las soluciones con el estilo de casillas resueltas.
La imagen completa se ajusta proporcionalmente a una página A4 con margen de 10 mm.
Las fuentes quedan dibujadas en una imagen de alta resolución; no hay texto seleccionable.

Bibliotecas fijadas y autoalojadas con licencia MIT: html2canvas 1.4.1 y jsPDF 4.2.1.
Se actualizan las versiones de recursos HTML y la caché PWA a v66.

## Evidencia de verificación

- Regresión general: 54 pruebas superadas (`node --test tests/*.test.cjs tests/*.test.mjs`).
- Motor diario: suite `jokoak/gurutzegramak/test-core.cjs` superada.
- Navegador Edge/Chromium: ambos modos y ambos PDF, 1440 y 320 px; pistas completas,
  ausencia de respuestas del alumno, aislamiento del progreso, página A4 única,
  limpieza tras error y reintento superados. Suite reproducible con datos sintéticos:
  `tests/crossword-pdf.browser.cjs`.
- Datos reales del 2026-11-23: cuatro descargas generadas desde el frontend local con
  las dos tablas públicas del día. Números, posiciones, diez pistas y soluciones revisados;
  PDF de alumno vacío incluso con progreso previo. Ninguna escritura en Supabase.
- PDF finales comprobados con Poppler: una página A4 (595.28 × 841.89 pt), sin cortes.
  Inspección visual de los PDF rasterizados realizada. Muestras fuera del repositorio
  público para no duplicar el banco real de respuestas en Git.

## Protocolos y límites

Se han revisado el README principal y el del módulo: recursos versionados, privacidad,
datos diarios bajo RLS y separación entre prueba técnica y aprobación académica.
No hay AGENTS.md en esta copia. No se ha localizado `00_PROTOKOLO_KOMUNA` en el
espacio local ni en la búsqueda de Drive. No se declara conformidad integral con
documentos originales ausentes ni una nueva validación lingüística del contenido.
La petición actual autoriza publicar este cambio técnico; el estado editorial del
banco y las revisiones académicas pendientes permanecen como constan en el módulo.

No probado en Safari/iOS, Android físico ni Firefox. No se afirma prueba física de impresión.
Los resultados de publicación y la comprobación posterior se deben consultar en el
despliegue asociado al commit de este cambio; este documento no anticipa su éxito.
