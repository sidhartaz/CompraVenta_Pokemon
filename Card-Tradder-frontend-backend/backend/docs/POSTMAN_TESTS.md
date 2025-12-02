# Pruebas manuales tipo Postman

Este documento resume un flujo mínimo para validar la API con herramientas como **Postman** o `curl`. Incluye los cuerpos de ejemplo y los encabezados necesarios para JWT, roles y caché.

## Preparación
1. Arranca la API con MongoDB y Redis (por ejemplo `docker compose up --build`).
2. Asegúrate de tener un usuario **admin** y al menos un **vendedor** y **cliente**:
   - Admin rápido: `docker compose exec api node scripts/createAdmin.js admin@example.com admin123`.
   - Registra vendedor y cliente con `POST /api/register`.
3. Guarda el `token` devuelto en el login para usarlo en los pasos siguientes.

> Nota: En este entorno de revisión no fue posible lanzar Docker ni instalar MongoDB/Redis por restricciones de red, por lo que no se ejecutaron las llamadas. Usa estos pasos para replicar las pruebas localmente.

## 1) Autenticación y roles
- **Login** (`POST /api/login`)
  ```json
  { "email": "admin@example.com", "password": "admin123" }
  ```
  - Esperado: `200 OK` con `token` y `role`.
- **Perfil protegido** (`GET /api/me` con `Authorization: Bearer <token>`)
  - Esperado: `200 OK` con datos del usuario autenticado.

## 2) Publicación y aprobación de cartas
- **Crear listing (vendedor)** (`POST /api/listings` con token de vendedor)
  ```json
  {
    "cardId": "abc123",
    "condition": "Near Mint",
    "price": 25,
    "description": "Charizard holo primera edición"
  }
  ```
  - Esperado: `201 Created` con `status: "pendiente"` y `sellerId` del vendedor.
- **Listar pendientes (admin)** (`GET /api/admin/publications?status=pendiente` con token de admin)
  - Esperado: incluye la publicación recién creada.
- **Aprobar** (`PATCH /api/admin/publications/:id/status`)
  ```json
  { "status": "aprobada" }
  ```
  - Esperado: `200 OK` y cambio de estado.
- **Actualizar/eliminar** (`PUT`/`DELETE /api/listings/:id` con token del vendedor propietario)
  - Esperado: solo el dueño puede modificar; respuesta `403` si otro usuario lo intenta.

## 3) Catálogo y caché
- **Búsqueda cacheada** (`GET /api/cards/search?q=charizard`)
  - Primera llamada: header `X-Cache: MISS`.
  - Segunda llamada (misma query): header `X-Cache: HIT` y respuesta rápida desde Redis.
- **Detalle** (`GET /api/cards/:id` de una publicación aprobada)
  - Esperado: datos de la carta y `sellerId`, solo si `status=aprobada`.

## 4) Órdenes, reservas y estados de pago
- **Crear compra** (`POST /api/orders` con token de cliente)
  ```json
  { "listingId": "<id-listing-aprobado>", "type": "compra", "note": "Compra directa" }
  ```
  - Esperado: `201 Created` con `status: "pendiente"` y primer registro en `history`.
- **Crear reserva** (`POST /api/orders` con `type: "reserva"`)
  - Esperado: estado inicial `reservada` y `history` indicando creación.
- **Listar órdenes** (`GET /api/orders`)
  - Admin: todas las órdenes. Vendedor: solo las de sus publicaciones. Cliente: solo sus compras/reservas.
- **Detalle con historial** (`GET /api/orders/:id`)
  - Esperado: objeto `history` con cada cambio de estado (`status`, `note`, `changedBy`, `changedAt`).
- **Actualizar estado** (`PATCH /api/orders/:id/status`)
  ```json
  { "status": "pagada", "note": "Pago confirmado por el vendedor" }
  ```
  - Solo vendedor/admin pueden marcar `pagada`/`reservada`/`pendiente`; el comprador puede marcar `cancelada`.
  - Esperado: `200 OK` y nueva entrada en `history`.

## 5) Validaciones adicionales
- Registrar usuario con rol inválido → `400 Bad Request`.
- Acceder a rutas admin con rol vendedor/cliente → `403 Forbidden`.
- Crear listing sin `cardId` o `condition` → `400 Bad Request` (validación de modelo).
