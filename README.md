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
