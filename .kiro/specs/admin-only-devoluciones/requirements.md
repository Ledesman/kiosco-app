# Documento de Requisitos: Restricción de Permisos para Devoluciones

## Introducción

Este documento especifica los requisitos para implementar un control de acceso basado en roles que restrinja el acceso a la funcionalidad de Devoluciones exclusivamente a usuarios con rol de administrador. La solución incluye validación en el frontend para mejorar la experiencia de usuario y validación en el backend para garantizar la seguridad del sistema.

## Glosario

- **Sistema**: La aplicación completa de punto de venta (frontend + backend)
- **Usuario**: Persona autenticada que utiliza el sistema
- **Administrador**: Usuario con rol 'admin' que tiene permisos completos
- **Cajero**: Usuario con rol 'cajero' que tiene permisos limitados
- **AdminRoute**: Componente de React que protege rutas restringidas a administradores
- **AuthContext**: Contexto de React que gestiona el estado de autenticación
- **Middleware_isAdmin**: Middleware de Express que valida permisos de administrador
- **Token_JWT**: Token de autenticación JSON Web Token que contiene información del usuario
- **Página_Devoluciones**: Interfaz para gestionar devoluciones de productos
- **Menú_Navegación**: Barra lateral con enlaces a las diferentes secciones del sistema

## Requisitos

### Requisito 1: Protección de Ruta en Frontend

**User Story:** Como desarrollador, quiero proteger la ruta de devoluciones en el frontend, para que solo usuarios administradores puedan acceder a ella.

#### Acceptance Criteria

1. WHEN un usuario no autenticado intenta acceder a /devoluciones, THEN THE Sistema SHALL redirigir al usuario a la página de login
2. WHEN un usuario con rol 'cajero' intenta acceder a /devoluciones, THEN THE Sistema SHALL redirigir al usuario a la página /unauthorized
3. WHEN un usuario con rol 'admin' accede a /devoluciones, THEN THE Sistema SHALL renderizar la Página_Devoluciones
4. WHILE THE AuthContext está cargando el estado de autenticación, THE Sistema SHALL mostrar un indicador de carga
5. WHEN THE AdminRoute verifica permisos, THE Sistema SHALL obtener el rol del usuario desde el AuthContext

### Requisito 2: Página de Acceso Denegado

**User Story:** Como usuario sin permisos, quiero ver un mensaje claro cuando intento acceder a una sección restringida, para que entienda por qué no puedo acceder.

#### Acceptance Criteria

1. WHEN un usuario es redirigido a /unauthorized, THEN THE Sistema SHALL mostrar un mensaje indicando que no tiene permisos suficientes
2. WHEN THE Página_Unauthorized se muestra, THE Sistema SHALL proporcionar un botón para volver al dashboard
3. WHEN THE Página_Unauthorized se renderiza, THE Sistema SHALL mantener la consistencia visual con el resto de la aplicación

### Requisito 3: Navegación Condicional en Menú

**User Story:** Como usuario, quiero ver solo las opciones del menú a las que tengo acceso, para que la interfaz sea clara y no confusa.

#### Acceptance Criteria

1. WHEN un usuario con rol 'admin' visualiza el Menú_Navegación, THEN THE Sistema SHALL mostrar el enlace "Devoluciones"
2. WHEN un usuario con rol 'cajero' visualiza el Menú_Navegación, THEN THE Sistema SHALL ocultar el enlace "Devoluciones"
3. WHEN THE Menú_Navegación se renderiza, THE Sistema SHALL evaluar el rol del usuario desde el AuthContext
4. WHEN el rol del usuario cambia, THEN THE Sistema SHALL actualizar el Menú_Navegación inmediatamente

### Requisito 4: Protección de Endpoints en Backend

**User Story:** Como administrador del sistema, quiero que todos los endpoints de devoluciones estén protegidos en el backend, para que la seguridad no dependa solo del frontend.

#### Acceptance Criteria

1. WHEN una petición llega a cualquier endpoint de devoluciones, THEN THE Sistema SHALL verificar que el usuario esté autenticado mediante authenticateToken
2. WHEN una petición autenticada llega a un endpoint de devoluciones, THEN THE Middleware_isAdmin SHALL verificar que el rol del usuario sea 'admin'
3. WHEN un usuario con rol 'cajero' intenta acceder a un endpoint de devoluciones, THEN THE Sistema SHALL retornar código HTTP 403 con mensaje de error
4. WHEN un usuario con rol 'admin' accede a un endpoint de devoluciones, THEN THE Sistema SHALL procesar la petición normalmente
5. WHEN THE Middleware_isAdmin rechaza una petición, THE Sistema SHALL incluir un mensaje descriptivo en la respuesta

### Requisito 5: Validación de Token JWT

**User Story:** Como administrador del sistema, quiero que el rol del usuario se valide desde el token JWT firmado, para que no pueda ser manipulado por el cliente.

#### Acceptance Criteria

1. WHEN THE Sistema valida permisos en el backend, THE Sistema SHALL obtener el rol desde el Token_JWT decodificado
2. WHEN un usuario intenta manipular su rol en localStorage, THEN THE Sistema SHALL rechazar las peticiones basándose en el Token_JWT
3. WHEN THE Token_JWT expira, THEN THE Sistema SHALL retornar código HTTP 401 y requerir nueva autenticación
4. WHEN THE Sistema verifica el rol, THE Sistema SHALL usar únicamente la información del Token_JWT firmado por el servidor

### Requisito 6: Manejo de Errores de Autorización

**User Story:** Como usuario, quiero recibir mensajes claros cuando no tengo permisos, para que entienda qué está sucediendo.

#### Acceptance Criteria

1. WHEN THE Sistema detecta un intento de acceso no autorizado, THEN THE Sistema SHALL registrar el evento en los logs del servidor
2. WHEN un usuario sin permisos intenta acceder a un endpoint protegido, THEN THE Sistema SHALL retornar un mensaje de error descriptivo
3. IF THE Token_JWT es inválido o está expirado, THEN THE Sistema SHALL retornar código HTTP 401 con mensaje apropiado
4. IF el usuario está autenticado pero no tiene permisos, THEN THE Sistema SHALL retornar código HTTP 403 con mensaje apropiado

### Requisito 7: Consistencia Frontend-Backend

**User Story:** Como desarrollador, quiero que las validaciones de permisos sean consistentes entre frontend y backend, para que no haya discrepancias de seguridad.

#### Acceptance Criteria

1. WHEN THE AdminRoute permite acceso en el frontend, THEN THE Middleware_isAdmin SHALL permitir acceso en el backend para el mismo usuario
2. WHEN THE Sistema valida permisos, THE Sistema SHALL usar la misma lógica de verificación de rol en ambas capas
3. WHEN un usuario tiene rol 'admin' en el Token_JWT, THEN THE Sistema SHALL permitir acceso tanto en frontend como en backend
4. WHEN un usuario tiene rol 'cajero' en el Token_JWT, THEN THE Sistema SHALL denegar acceso tanto en frontend como en backend

### Requisito 8: Idempotencia de Verificación

**User Story:** Como desarrollador, quiero que la verificación de permisos sea idempotente, para que múltiples verificaciones produzcan el mismo resultado.

#### Acceptance Criteria

1. WHEN THE Sistema verifica permisos múltiples veces para el mismo usuario, THEN THE Sistema SHALL retornar el mismo resultado en todas las verificaciones
2. WHEN THE AdminRoute evalúa permisos, THE Sistema SHALL producir el mismo resultado sin efectos secundarios
3. WHEN THE Middleware_isAdmin evalúa permisos, THE Sistema SHALL producir el mismo resultado sin modificar el objeto de petición

