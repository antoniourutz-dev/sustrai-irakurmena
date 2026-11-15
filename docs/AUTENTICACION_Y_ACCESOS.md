# SUSTRAI · Usuarios, progreso y administración (piloto)
Estado: rama de desarrollo pendiente de revisión y aceptación funcional.
Fecha: 2026-11-15.

## Experiencia

- Invitados: la aplicación mantiene el acceso anónimo y el guardado en este navegador, como hasta ahora.
- Alumnos: pueden registrarse/iniciar sesión por correo y contraseña (Supabase Auth), acceder a **Nire espazioa**, recuperar sus trabajos desde varios dispositivos y exportar o eliminar elementos de trabajo.
- Administración: `lumi@sustrai.app`, ya confirmada en Auth, queda asociada por UUID a `sustrai_private.sr_app_admins`. Ninguna dirección de correo ni parámetro suministrado por el navegador concede permisos administrativos.
- El administrador ve solo perfiles creados en SUSTRAI, no todas las cuentas existentes en el proyecto compartido de Supabase.

## Modelo y privacidad

- `public.sr_app_profiles`: miembros que accedieron a SUSTRAI, actividad y estado.
- `public.sr_app_state`: estados textuales por clave y usuario (borradores, esquemas, marcas, respuestas y cronómetros). RLS de propietario y lectura administrativa; sin acceso público.
- `public.sr_app_reading_results`: intentos finalizados con puntuación calculada por la función de corrección del servidor, no enviada por el cliente.
- `public.sr_app_content_rules`: permisos predeterminados por recurso para invitados y registrados.
- `public.sr_app_grants`: permiso individual (permite/deniega) con precedencia sobre el predeterminado.
- `public.sr_can_access` y políticas RLS en todas las tablas de recursos publicados de los tres módulos.
- `public.sr_admin_students`: directorio y datos agregados restringido al administrador.
- `supabase/functions/sr-grade-exam`: comprueba la elegibilidad con JWT del solicitante antes de consultar las soluciones internas y registra resultados autenticados de forma idempotente.

El acceso a los PDF originales alojados fuera de SUSTRAI es independiente: la restricción de la aplicación **no convierte en privado un enlace externo público**. No se guardan grabaciones de voz en Supabase; siguen siendo locales y descargables manualmente.

## Sincronización de trabajos

Se conservan los nombres de claves `sustrai-*` existentes. En modo invitado el backend no almacena borradores; la información vive en `localStorage`. Con sesión verificada se usa un almacén individual cargado desde `sr_app_state`, actualizado de forma periódica. **No se importan automáticamente los datos de invitados**; el usuario debe solicitarlo de forma explícita, lo que evita mezclar trabajos de otras personas en un ordenador compartido.

Conexiones fallidas notifican que no se ha guardado en la nube. No afirmar sincronización exitosa sin prueba E2E.

## Configuración Supabase Auth antes de abrir al público

1. Verificar `Confirm email` y reglas de alta de cuentas en Authentication > Providers.
2. Configurar `Site URL = https://sustrai-irakurmena.vercel.app` y redirects permitidos a la misma URL; revisar previews antes de habilitarlos.
3. Configurar SMTP de confianza, límites de envío, protección antiautomatización y política de recuperación de contraseña.
4. Recomendar MFA a la cuenta administradora; revisar periódicamente usuarios y eventos.
5. Preparar aviso de privacidad, finalidad/base jurídica, plazos de conservación, contacto del responsable, derechos de supresión/exportación y condiciones de uso **con datos reales del responsable**.
6. Habilitar observabilidad y copias de seguridad; revisar el control de cuotas del proyecto compartido.

## Pruebas verificadas hasta ahora

- Sintaxis de módulos JavaScript: compilación V8 sin ejecución DOM.
- RLS anónimo: 32 exámenes, 100 ejercicios, 962 ítems de lectura, 45 tareas de escritura y 53 fichas orales aún visibles por defecto.
- RLS con restricción temporal transaccional: al ocultar un examen al invitado, su total visible pasa de 32 a 31 y la función de acceso devuelve false. Prueba revertida.
- Usuario administrador por UUID: el rol es reconocido en contexto autenticado; los usuarios normales no lo heredan.
- Excepción individual: la regla de visibilidad puede ser sobreescrita con una concesión específica.
- Supabase Edge Function de corrección: v3 desplegada con comprobación de permisos.

## Pruebas PENDIENTES antes de fusionar a producción

- Flujo real de registro, correo de confirmación, inicio de sesión, recuperación de clave y salida en navegador.
- E2E autenticado: escribir un idazlana, cambiar de equipo, recuperar texto y esquemas, borrar marcas.
- E2E administrativo: restringir un recurso, verificar 403 / ausencia de contenidos para invitado, conceder a un alumno concreto.
- E2E lectura: práctica/simulación independientes, corrección, repetición y resultado registrado una sola vez.
- Accesibilidad, móvil (320/375/768px), sesiones expiradas, red inestable y cuotas.
- Tests de no filtración de respuestas por APIs y objetos externos de Supabase.
- Validación de texto legal y consentimiento para alumnos antes de publicación masiva.

## Operaciones

- SQL versionado en `supabase/migrations/`; las migraciones ya se aplicaron de forma aditiva, sin retirar el acceso anónimo preexistente.
- Código de la Edge Function versionado en `supabase/functions/sr-grade-exam/index.ts`.
- Las pantallas `/admin/` y `/mi-espacio/` son parte de la rama de desarrollo; **no están en producción hasta fusionar**.
- No se ha creado contraseña ni se ha enviado correo alguno al administrador desde este cambio.
