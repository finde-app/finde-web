# Centro de atención Finde — V19

**Estado:** especificación funcional; pendiente de implementación.

## Propósito
Ofrecer a turistas, propietarios y proveedores de experiencias un canal de reclamos, felicitaciones, sugerencias de mejora y asuntos de calidad de vida/convivencia vinculados al servicio.

## Formulario
- Tipo: reclamo, felicitación, sugerencia de mejora o calidad de vida/convivencia.
- Rol: turista, propietario o proveedor de experiencias.
- Servicio/reserva/publicación relacionada (cuando corresponda).
- Asunto, descripción, fecha del hecho y archivos adjuntos opcionales.
- Datos de contacto de la persona que presenta el caso, sujetos a las reglas de privacidad.
- Consentimiento/aviso de tratamiento de datos personales y confirmación de envío.
- Identificador de seguimiento y acuse de recibo.

## Gestión administrativa
- Bandeja central de casos; filtros por tipo, estado, proveedor y fecha.
- Estados: recibido, en revisión, esperando antecedentes, resuelto y cerrado.
- Historial auditable de mensajes, cambios de estado y decisiones.
- Avisos por correo electrónico al ingresar, actualizar y resolver casos.
- Adjuntos protegidos; permisos por rol y controles contra archivos peligrosos.
- Posibilidad de relacionar un reclamo con suspensión de publicaciones y gestión de reembolsos; no ejecutar retenciones o devoluciones sin verificación y autorización del operador de pagos.
- Indicadores agregados de calidad y oportunidades de mejora.

## Privacidad y acceso
- El administrador autorizado accede a la gestión integral.
- El reclamante consulta únicamente sus propios casos.
- Cada proveedor accede solo a los casos que le sean formalmente comunicados y a los datos mínimos necesarios para resolverlos; no se revelan teléfono, correo ni RUT del turista sin fundamento jurídico y necesidad operacional.
- Las felicitaciones y reseñas no se publican automáticamente: requieren consentimiento y moderación.

## Pendientes de definición
- Plazos de primera respuesta y resolución, escalamiento y apelación.
- Tratamiento de casos anónimos, denuncias graves y emergencias.
- Política de conservación y eliminación de datos, y textos legales.
- Diseño y construcción de formulario, base de datos, API, panel administrativo y notificaciones.

## Reclamo desde una reserva
- En **Mis reservas**, cada reserva tendrá la acción **Presentar reclamo**.
- Al abrir el formulario desde una reserva, el sistema asociará automáticamente el identificador de reserva, el alojamiento o experiencia, el proveedor y las fechas pertinentes, sin pedir que el turista vuelva a ingresarlos.
- El turista seleccionará el motivo, describirá el problema y podrá adjuntar evidencias; recibirá un número de caso y podrá seguir su estado desde **Mis reclamos**.
- La administración verá el caso vinculado a la reserva y podrá comunicarse con las partes, solicitar antecedentes, documentar decisiones y gestionar eventuales reembolsos conforme al operador de pagos y la normativa aplicable.
- El proveedor solo recibirá los antecedentes estrictamente necesarios para responder, sin exponer datos personales de contacto del turista.
- La creación del reclamo no ejecutará automáticamente un reembolso, una retención o una sanción; esas acciones requieren revisión y autorización.
- Considerar reclamos sobre reservas finalizadas y canceladas, además de las próximas o en curso.

**Implementación pendiente:** botón en la vista de reservas, formulario precargado, persistencia en base de datos, permisos, notificaciones y seguimiento.
