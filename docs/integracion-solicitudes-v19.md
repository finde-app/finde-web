# Integración de solicitudes de proveedores — V19

## Estado
Tabla `solicitudes_proveedores` creada manualmente en MariaDB `omouxppn_finde` según confirmación de phpMyAdmin. **La API y el formulario conectado aún no están implementados.**

## Infraestructura existente
- Frontend de pruebas: `https://prueba.findito.cl`, rama `desarrollo-v19`, despliegue en `/home/omouxppn/finde-v19-preview`.
- Backend Node.js existente: `/home/omouxppn/finde-backend`, URL `https://findito.cl/api`. **Es compartido con el dominio público; no reemplazarlo sin respaldo y pruebas.**
- El archivo `provider-interest.js` actualmente guarda registros únicamente en `localStorage`; su panel de interesados también es local.

## Contrato de API propuesto (por implementar)
`POST /api/solicitudes-proveedores`
- JSON: `{nombre_contacto, correo, tipo_servicio, nombre_servicio, comuna, comentario}`
- Validar tipos, campos obligatorios, longitudes según SQL, correo, tipo de servicio permitido, tamaño máximo del cuerpo y normalización de espacios.
- Consultas SQL parametrizadas con `mysql2`; no concatenar entradas del usuario.
- Aplicar límite de solicitudes por IP, medidas antispam y consentimiento informado antes de captar datos reales.
- Respuesta de éxito: HTTP 201 con `{id, estado:"pendiente"}`; errores sin datos internos del servidor.
- CORS: autorizar explícitamente `https://prueba.findito.cl` para el formulario en pruebas; no usar `*` con credenciales.
- No enviar credenciales de MariaDB al navegador ni al repositorio.

`GET /api/admin/solicitudes-proveedores` y `PATCH /api/admin/solicitudes-proveedores/:id`
- **Exigen autenticación real y rol administrador del lado del servidor**. No usar la contraseña de demostración de `app.js`.
- Listar con paginación, ordenar por fecha, cambiar estados permitidos y auditar cambios.
- Nunca exponer el listado a visitantes o proveedores.

## Orden de implementación
1. Revisar el `app.js` y `package.json` reales del backend (sin archivos de secretos).
2. Preparar respaldo y un entorno de API de pruebas, o un mecanismo de despliegue reversible sin interrumpir V18.
3. Programar endpoints y probarlos con solicitudes ficticias.
4. Cambiar `provider-interest.js` para enviar datos al backend; mostrar errores y confirmación reales.
5. Crear acceso administrativo seguro y listado centralizado.
6. Validar privacidad, SSL, seguridad y persistencia; recién entonces habilitar convocatoria.

## Privacidad
No iniciar captación pública hasta disponer de aviso de privacidad claro, base legal de tratamiento, contacto del responsable y medidas de seguridad.
