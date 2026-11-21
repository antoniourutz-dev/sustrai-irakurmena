# SUSTRAI · Irakurmena

Plataforma de práctica de comprensión lectora de euskera C1 con modelos IVAP y HABE.

**Producción:** https://sustrai-irakurmena.vercel.app/

## Arquitectura

- **Frontend:** HTML, CSS y JavaScript (sin proceso de compilación).
- **Alojamiento:** Vercel, proyecto existente `sustrai-irakurmena`.
- **Datos:** Supabase **Lexikoa**, módulo SUSTRAI con tablas `sr_*`.
- **Contenido:** 32 exámenes publicados (23 IVAP y 9 HABE), 100 ejercicios y 962 preguntas al realizar la importación inicial.
- **Corrección:** función de Supabase `sr-grade-exam`; las soluciones oficiales permanecen en el backend privado.
- **Lectura pública:** llamada RPC `sr_public_exam_snapshot`.

## Archivos

```text
index.html          # Inicio: las tres destrezas, cuenta y modos de trabajo
theme.css           # Sistema de diseño «Fokua»: tokens (--s-*), fuentes, cabecera y barra inferior
start.css / home.js # Estilos y lógica del inicio
auth.js / auth.css  # Cuenta, sesión y sincronización con Supabase
fonts/              # Fuentes autoalojadas (Inter, Inter Display, Sustrai Serif) · ver fonts/README.md
aditzak/            # Catálogo de actividades SMX, vista editorial y captura de respuestas
irakurmena/         # Catálogo de exámenes de lectura
ivap/ · habe/       # Taller de lectura (HTML); comparten style.css
style.css           # Estilos del taller de lectura
app.js · habe/app.js# Lógica del taller IVAP / HABE
idazlanak/          # Idazmena (expresión escrita)
ahozkoa/            # Ahozkoa (expresión oral)
mi-espacio/         # Nire espazioa (progreso del alumno)
admin/              # Panel de administración
sw.js · pwa.js      # Service worker (caché offline)
supabase/           # Migraciones SQL y función sr-grade-exam
```

## Diseño

Todas las páginas cargan `theme.css` antes de su hoja propia y usan los tokens `--s-*`
(color, tipografía, radios). La cabecera (`.site-header`) y la barra inferior móvil (`.tabbar`)
son idénticas en todas las páginas. Al cambiar un CSS o JS hay que subir el `?v=` de los HTML
y `CACHE_VERSION` en `sw.js`.

## Desarrollo local

Se puede abrir con un servidor estático. Por ejemplo, desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Visita `http://localhost:8000/` para iniciar el flujo guiado. Las interfaces de examen quedan en `/ivap/` y `/habe/`; la portada transmite el modo elegido mediante `?mode=simulation` o `?mode=practice`.

**Nota:** la función de corrección limita los orígenes permitidos a los dominios de la aplicación en Vercel. Para probarla desde localhost habría que habilitar explícitamente el origen de desarrollo en esa función, sin abrir los permisos de producción innecesariamente.

## Supabase y seguridad

El código cliente contiene la URL de Supabase y una clave pública `anon`, pensada para el navegador. **Nunca** incluir aquí la clave `service_role`, secretos de Edge Functions, contraseñas ni datos personales de alumnos.

No se exportan los textos y respuestas desde Supabase al repositorio. Los cambios en el esquema deben registrarse como migraciones revisadas antes de su aplicación, nunca copiando credenciales.

## Despliegue

Este repositorio contiene una copia del código de la versión de producción de Vercel recuperada el 14-11-2026 (`dpl_2snPti2ZstGn8dauwCwJ4xQ9Rdd1`). El proyecto Vercel existente está conectado a este repositorio GitHub (`main`) para desplegar nuevos commits automáticamente. El dominio de producción `sustrai-irakurmena.vercel.app` permanece asociado al mismo proyecto. La integración se verificó el 14-11-2026.

## Módulos futuros

La arquitectura de datos compartida está preparada para ampliar la plataforma con **Idazlanak** y **Ahozkoak**. Sus interfaces y flujos de evaluación no forman parte de este código inicial.

## ADITZAK · Piloto integrado (2026-11-21)

El módulo de `/aditzak/` consulta las actividades de `smx_activities`, las versiones de `smx_activity_versions` y los ítems de `smx_activity_items` en Supabase Lexikoa. Las RLS limitan a alumnos a actividades aprobadas y autorizan al administrador a previsualizar borradores sin ver las claves. No se transfieren soluciones al navegador.

Las actividades aprobadas pueden almacenar intentos en `smx_attempts` y respuestas originales en `smx_attempt_responses`. **La corrección automática todavía no está conectada**, y la interfaz no debe mostrar aciertos/puntuaciones. Las seis actividades B2 y 28 ítems actuales permanecen en estado `draft`; solo aparecen para la administración. El modo de previsualización no guarda intentos.

Revisar antes de fusionar: carga con sesión administradora, ocultación para alumno, permisos RLS en REST, respuesta del servicio de guardado, accesibilidad móvil y versión PWA. No habilitar los cuatro controles `*_ok` ni promover actividades sin una auditoría independiente.


## Navegación de tres áreas · piloto (2026-11-21)

La portada presenta exactamente tres vías de aprendizaje: **Azterketak** (/azterketak/), **Gramatika** (/gramatika/) y **Ariketak** (/ariketak/).

- **Azterketak** agrupa sin alterar rutas ni datos de /irakurmena/, /idazlanak/ y /ahozkoa/.
- **Gramatika** es una entrada editorial futura: no muestra unidades sin publicar.
- **Ariketak** organiza cuadernos por nivel y bloque. /aditzak/ es un bloque de Ariketak y mantiene la previsualización solo para administradores.
- La cabecera y la barra inferior móvil comparten los mismos cinco enlaces (incluido inicio y espacio personal) en todas las páginas principales. Las rutas de examen siguen funcionando.
- No se modifica el esquema ni se aprueban las actividades en esta fase. Revisar en preview escritorio, móvil, navegación de teclado, sesión administradora y alumnado, caché PWA y enlaces existentes antes de fusionar.

## Ariketak · Catálogo navegable en Supabase (2026-11-21, paso 2)

- Catálogo relacional: `smx_exercise_blocks` (6 bloques), `smx_exercise_sections` (93 apartados) y `smx_exercise_activity_links` (6 relaciones de la primera unidad B2).
- Clasificación temática derivada del inventario de referencias de seis cuadernos. **No se copian enunciados ni respuestas de libros comerciales.**
- Navegación `/ariketak/`: B2/C1/C2 → bloque → apartado → ejercicios, con URL persistente (`?maila=B2&blokea=B2-ADI&atala=B2-ADI-01`), botones de regreso, búsqueda local de apartados y estados vacíos.
- Las tablas de bloques y apartados contienen solo metadatos de catálogo; se pueden consultar sin sesión. Los vínculos a actividades, sus versiones y preguntas respetan RLS.
- El alumno no ve borradores. El administrador autorizado puede navegar a los seis borradores y sus 28 ítems para revisión, sin claves de corrección.
- El catálogo abre `/aditzak/?activity=<uuid>&from=<ruta>`, validando el ID contra lo que devuelve RLS. El ejecutor ADITZAK **no corrige ni publica**.
- C2 está reservado sin inventar bloques o actividades. La mención `planned` significa contenido pendiente, no publicación.
- Pruebas obligatorias: anon (taxonomía pública, sin ejercicios), alumno autenticado (sin borradores), admin (6), menú móvil, enlaces directos, navegación atrás, accesibilidad y actualización PWA.
