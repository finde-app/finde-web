# Encuestas de satisfacción y calidad — Finde V19

**Estado:** módulo planificado; cuestionarios, formularios, base de datos y API pendientes de desarrollo.

## Objetivo
Contar con un espacio centralizado de encuestas para todos los actores de Finde, separado del centro de reclamos, felicitaciones y sugerencias y de las reseñas públicas.

## Destinatarios
1. **Turistas:** satisfacción con la reserva, información publicada, alojamiento o experiencia, cumplimiento, atención y soporte de Finde.
2. **Propietarios de alojamientos:** incorporación, gestión de publicaciones, reservas, pagos y soporte.
3. **Proveedores de experiencias:** inscripción, gestión de actividades, reservas, pagos y soporte.
4. **Equipo administrativo:** procesos, herramientas, coordinación y propuestas de mejora.

## Funcionalidades previstas
- Carpeta o módulo **Encuestas de satisfacción y calidad** dentro de administración.
- Catálogo de encuestas con título, público destinatario, versión, vigencia y estado (borrador, activa, cerrada).
- Plantillas editables de preguntas: escala de satisfacción, selección múltiple, sí/no y texto libre.
- Envío o invitación después de finalizar una reserva, estadía o experiencia, cuando corresponda.
- Encuestas periódicas para proveedores y equipo administrativo.
- Una respuesta por invitación cuando aplique, con medidas para prevenir duplicaciones.
- Tablero de resultados agregados, tasas de respuesta, filtros y exportación.
- Alertas internas ante evaluaciones bajas, sin convertir automáticamente una encuesta en reclamo.
- Acceso por rol: cada participante responde sus propias encuestas; administración ve resultados según permisos; proveedores no ven datos privados de turistas ni respuestas de otros proveedores.
- Configuración de encuestas anónimas o identificadas según finalidad, con información clara sobre privacidad y conservación.
- No publicar comentarios como reseñas sin consentimiento específico.

## Desarrollo posterior
- Diseñar cuestionarios y escalas para cada público.
- Definir momentos de envío, frecuencia, plazos y responsables.
- Crear tablas de encuestas, preguntas, invitaciones y respuestas en MariaDB.
- Implementar API autenticada, formularios, correos y reportes.
- Realizar pruebas de privacidad, accesibilidad y control de acceso.

**Prioridad:** dejar el espacio definido ahora; implementar después del registro real de proveedores, usuarios y reservas.
