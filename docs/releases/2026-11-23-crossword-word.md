# Crucigramas Word editables

Dos descargas nuevas por partida: Ikaslearen Worda e Irakaslearen Worda.
Se reutilizan los datos del crucigrama cargado, sus coordenadas, números y pistas.
Los documentos contienen tablas y párrafos nativos editables, sin imágenes ni protección.
La versión del alumno queda vacía aunque la partida tenga respuestas o pistas reveladas.

Las fuentes OFL de la aplicación se incrustan como instancias estáticas TrueType.
Se conserva el esquema de colores y la disposición de cuadrícula y pistas laterales.
Las tablas de Word tienen bordes rectos y la edición puede alterar la maquetación;
el PDF mantiene la captura del diseño CSS. No se presenta Word como una copia visual
exacta de todas las propiedades CSS.

Verificado: descargas reales de ambos modos y versiones desde Edge/Chromium a 1440 y
320 px, sin cambios en el progreso. Los cuatro archivos del 2026-11-23 se abrieron con
Microsoft Word en solo lectura y se exportaron para revisión visual: una página A4
por archivo, sin cortes. Se comprobaron todos los renders. El renderizador habitual
no pudo ejecutarse por ausencia de LibreOffice; se usó Word nativo como alternativa.

La suite de navegador comprueba ambas exportaciones: tablas, texto, letras, pistas,
fuentes incrustadas, ausencia de imágenes y de protección, además de la regresión PDF.
Se actualizan los recursos HTML y la caché PWA v67.

Cuatro copias DOCX se guardan por petición del usuario en SUSTRAI MAX BANKUA /
07_ARIKETAK / GURUTZEGRAMAK_WORD. No hay subida automática a Drive desde la app,
ni credenciales de Google en el código, ni cambios de permisos del banco.
La validación editorial y las limitaciones de protocolos originales son las mismas
que en la entrega de PDF; no se otorga ninguna nueva aprobación académica.
