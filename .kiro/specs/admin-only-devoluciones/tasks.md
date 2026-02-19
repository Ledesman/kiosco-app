# Plan de Implementación: Restricción de Permisos para Devoluciones

## Resumen

Implementar control de acceso basado en roles para restringir la funcionalidad de Devoluciones exclusivamente a usuarios administradores. La solución incluye protección de rutas en el frontend (React) y validación de permisos en el backend (Express) mediante middleware.

## Tareas

- [x] 1. Crear componente AdminRoute para protección de rutas
  - Crear archivo frontend/src/components/AdminRoute.jsx
  - Implementar lógica de verificación de rol desde AuthContext
  - Manejar estados de carga, no autenticado y no autorizado
  - Implementar redirecciones apropiadas según el estado del usuario
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Escribir tests unitarios para AdminRoute
  - Test: renderiza loading cuando loading=true
  - Test: redirige a /login cuando user=null
  - Test: redirige a /unauthorized cuando user.role='cajero'
  - Test: renderiza children cuando user.role='admin'
  - Test: respeta prop useLayout
  - _Requisitos: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.2 Escribir test de propiedad para verificación idempotente
  - **Propiedad 5: Verificación de Permisos es Idempotente sin Efectos Secundarios**
  - **Valida: Requisitos 8.1, 8.2, 8.3**

- [x] 2. Crear página Unauthorized para acceso denegado
  - Crear archivo frontend/src/pages/Unauthorized.jsx
  - Implementar mensaje claro de acceso denegado
  - Agregar botón para volver al dashboard
  - Mantener consistencia visual con el resto de la aplicación
  - _Requisitos: 2.1, 2.2, 2.3_

- [x] 3. Actualizar configuración de rutas en App.jsx
  - Importar componente AdminRoute
  - Importar página Unauthorized
  - Agregar ruta /unauthorized
  - Envolver ruta /devoluciones con AdminRoute
  - _Requisitos: 1.1, 1.2, 1.3_

- [x] 4. Modificar Layout para navegación condicional
  - Actualizar menuItems para mostrar "Devoluciones" solo a administradores
  - Usar operador spread condicional basado en user.role
  - Asegurar que el menú se actualice cuando cambia el rol
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [ ]* 4.1 Escribir tests para navegación condicional
  - Test: menú muestra "Devoluciones" solo para admin
  - Test: menú oculta "Devoluciones" para cajero
  - _Requisitos: 3.1, 3.2_

- [x] 5. Proteger endpoints de devoluciones en backend
  - Abrir archivo backend/routes/devoluciones.js
  - Importar middleware isAdmin desde middleware/auth.js
  - Agregar middleware isAdmin a todos los endpoints (POST /, GET /buscar-venta, GET /venta/:id, GET /historial)
  - Verificar que authenticateToken ya esté aplicado
  - _Requisitos: 4.1, 4.2, 4.3, 4.4_

- [ ]* 5.1 Escribir tests unitarios para middleware isAdmin
  - Test: llama next() cuando req.user.role='admin'
  - Test: retorna 403 cuando req.user.role='cajero'
  - Test: retorna 403 cuando req.user.role es undefined
  - _Requisitos: 4.2, 4.3, 4.5_

- [ ]* 5.2 Escribir test de propiedad para consistencia frontend-backend
  - **Propiedad 4: Consistencia Frontend-Backend en Validación**
  - **Valida: Requisitos 7.1, 7.3, 7.4**

- [x] 6. Agregar logging de intentos no autorizados
  - Modificar middleware isAdmin en backend/middleware/auth.js
  - Agregar console.warn antes de retornar 403
  - Incluir username y rol en el mensaje de log
  - _Requisitos: 6.1, 6.2_

- [x] 7. Checkpoint - Verificar implementación completa
  - Verificar que todos los archivos se hayan creado correctamente
  - Asegurar que no hay errores de sintaxis
  - Confirmar que las importaciones son correctas
  - Preguntar al usuario si tiene dudas o necesita ajustes

- [ ]* 8. Pruebas de integración del flujo completo
  - Test: usuario admin puede acceder a /devoluciones y procesar devolución
  - Test: usuario cajero no puede acceder a /devoluciones
  - Test: usuario no autenticado es redirigido a /login
  - Test: token expirado es manejado correctamente
  - Test: manipulación de localStorage no permite bypass de seguridad
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 5.2, 7.1, 7.4_

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- El middleware isAdmin ya existe en backend/middleware/auth.js, solo necesita aplicarse a las rutas
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de corrección
- Los tests unitarios validan ejemplos específicos y casos borde
