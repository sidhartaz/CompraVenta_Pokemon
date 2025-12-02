# Pruebas manuales tipo Postman

Este documento resume un flujo mínimo para validar la API con herramientas como **Postman** o `curl`. Incluye los cuerpos de ejemplo y los encabezados necesarios para JWT, roles y caché.

## Preparación
1. Arranca la API con MongoDB y Redis (por ejemplo `docker compose up --build`).
2. Crea una **colección** y un **entorno** en Postman con estas variables:
   - `baseUrl`: `http://localhost:3000`
   - `adminToken`, `sellerToken`, `buyerToken`: se llenan tras hacer login.
3. Asegúrate de tener un usuario **admin** y al menos un **vendedor** y **cliente**:
   - Admin rápido: `docker compose exec api node scripts/createAdmin.js admin@example.com admin123`.
   - Registra vendedor y cliente con `POST {{baseUrl}}/api/register`.
4. Guarda el `token` devuelto en el login para usarlo en los pasos siguientes; en Postman puedes usar un script de **Tests** para copiarlo automáticamente a la variable de entorno:
   ```js
   // pestaña Tests
   const data = pm.response.json();
   if (data.token) {
     pm.environment.set("adminToken", data.token); // cambia adminToken por buyerToken/sellerToken según corresponda
   }
   ```

> Nota: En este entorno de revisión no fue posible lanzar Docker ni instalar MongoDB/Redis por restricciones de red, por lo que no se ejecutaron las llamadas. Usa estos pasos para replicar las pruebas localmente.

## 1) Autenticación y roles
- **Login** (`POST {{baseUrl}}/api/login`)
  ```json
  { "email": "admin@example.com", "password": "admin123" }
  ```
  - Esperado: `200 OK` con `token` y `role`.
- **Perfil protegido** (`GET {{baseUrl}}/api/me` con `Authorization: Bearer {{adminToken}}`)
  - Esperado: `200 OK` con datos del usuario autenticado.

## 2) Publicación y aprobación de cartas
- **Crear listing (vendedor)** (`POST {{baseUrl}}/api/listings` con token de vendedor)
  ```json
  {
    "cardId": "abc123",
    "condition": "Near Mint",
    "price": 25,
    "description": "Charizard holo primera edición",
    "imageData": "data:image/png;base64,iVBORw0K..."
  }
  ```
  - Esperado: `201 Created` con `status: "pendiente"` y `sellerId` del vendedor.
- **Listar pendientes (admin)** (`GET {{baseUrl}}/api/admin/publications?status=pendiente` con token de admin)
  - Esperado: incluye la publicación recién creada.
- **Aprobar** (`PATCH {{baseUrl}}/api/admin/publications/:id/status`)
  ```json
  { "status": "aprobada" }
  ```
  - Esperado: `200 OK` y cambio de estado.
- **Actualizar/eliminar** (`PUT`/`DELETE {{baseUrl}}/api/listings/:id` con token del vendedor propietario)
  - Esperado: solo el dueño puede modificar; respuesta `403` si otro usuario lo intenta.

## 3) Catálogo y caché
- **Búsqueda cacheada** (`GET {{baseUrl}}/api/cards/search?q=charizard`)
  - Primera llamada: header `X-Cache: MISS`.
  - Segunda llamada (misma query): header `X-Cache: HIT` y respuesta rápida desde Redis.
- **Detalle** (`GET {{baseUrl}}/api/cards/:id` de una publicación aprobada)
  - Esperado: datos de la carta y `sellerId`, solo si `status=aprobada`.

## 4) Órdenes, reservas y estados de pago
- **Crear compra** (`POST {{baseUrl}}/api/orders` con token de cliente)
  ```json
  { "listingId": "<id-listing-aprobado>", "type": "compra", "note": "Compra directa" }
  ```
  - Esperado: `201 Created` con `status: "pendiente"` y primer registro en `history`.
- **Crear reserva** (`POST {{baseUrl}}/api/orders` con `type: "reserva"`)
  - Esperado: estado inicial `reservada` y `history` indicando creación.
- **Listar órdenes** (`GET {{baseUrl}}/api/orders`)
  - Admin: todas las órdenes. Vendedor: solo las de sus publicaciones. Cliente: solo sus compras/reservas.
- **Detalle con historial** (`GET {{baseUrl}}/api/orders/:id`)
  - Esperado: objeto `history` con cada cambio de estado (`status`, `note`, `changedBy`, `changedAt`).
- **Actualizar estado** (`PATCH {{baseUrl}}/api/orders/:id/status`)
  ```json
  { "status": "pagada", "note": "Pago confirmado por el vendedor" }
  ```
  - Solo vendedor/admin pueden marcar `pagada`/`reservada`/`pendiente`; el comprador puede marcar `cancelada`.
  - Esperado: `200 OK` y nueva entrada en `history`.

## 5) Validaciones adicionales
- Registrar usuario con rol inválido → `400 Bad Request`.
- Acceder a rutas admin con rol vendedor/cliente → `403 Forbidden`.
- Crear listing sin `name`, `condition` o `price` → `400 Bad Request` (validación de modelo).
