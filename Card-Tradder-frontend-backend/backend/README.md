# Card-Tradder – Backend

Backend en **Node.js + Express + MongoDB** para la plataforma de intercambio y venta de cartas coleccionables.

## Requisitos (modo local)

- Node.js
- MongoDB en ejecución (por defecto: `mongodb://127.0.0.1:27017/cardtrader`)

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Copia el archivo de ejemplo de entorno y edítalo:

```bash
cp .env.example .env
```

Ajusta `MONGO_URI` y `JWT_SECRET` si es necesario.

## Ejecución

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` y servirá el frontend desde `../frontend/public`.

## Ejecución con Docker Compose

1. Copia y adapta las variables de entorno:

```bash
cp .env.example .env
```

2. Construye e inicia los servicios (API + MongoDB + Redis):

```bash
docker compose up --build
```

- La API quedará disponible en `http://localhost:3000`.
- MongoDB se expone en el puerto `27017` y Redis en `6379`.
- El contenedor de la API usa la configuración de `.env` y, por defecto, se conecta a los contenedores `mongo` y `redis` definidos en `docker-compose.yml`.

## Roles, autenticación y endpoints clave

- **Registro**: `POST /api/register` con `name`, `email`, `password` y `role` (`cliente`, `vendedor` o `admin`).
- **Login**: `POST /api/login` devuelve JWT y rol.
- **Ruta protegida**: `GET /api/me` requiere header `Authorization: Bearer <token>`.
- **Restricción por rol**:
  - `GET /api/listings` acepta `?status=` (pendiente/aprobada/rechazada) y devuelve el vendedor (solo `status=aprobada` se usa en catálogos de cartas).
  - `POST/PUT/DELETE /api/listings` solo para rol `vendedor` y únicamente sobre sus propias publicaciones.
  - `GET /api/admin/publications` y `PATCH /api/admin/publications/:id/status` requieren rol `admin` para aprobar o rechazar publicaciones.

### Flujo mínimo de publicaciones

1. Crear usuarios con `role: vendedor` y `role: admin` (ver sección de semillas).
2. El vendedor crea un listing con `cardId`, `price` y `condition` → queda en `status: pendiente`.
3. El admin consulta `GET /api/admin/publications?status=pendiente` y aprueba/rechaza con `PATCH ... { "status": "aprobada" }`.
4. Solo las publicaciones **aprobadas** aparecen en `GET /api/cards/search` (catálogo cacheado) y en `GET /api/cards/:id`.

### Órdenes, reservas y pagos externos

- **Crear orden o reserva**: `POST /api/orders` con `listingId` y `type` (`compra` o `reserva`).
  - `type=compra` → estado inicial `pendiente`.
  - `type=reserva` → estado inicial `reservada`.
- **Consultar mis órdenes**: `GET /api/orders`
  - Admin: todas las órdenes.
  - Vendedor: órdenes de sus publicaciones.
  - Cliente: sus compras/reservas.
- **Detalle con historial**: `GET /api/orders/:id` devuelve la historia de cambios.
- **Actualizar estado**: `PATCH /api/orders/:id/status { "status": "pagada" | "cancelada" | "reservada" | "pendiente" }`
  - Vendedor/Admin pueden marcar `pagada`, `reservada`, etc.
  - El comprador puede cancelar su propia orden (`status=cancelada`).
  - Cada cambio queda registrado en `history` con quién lo realizó y fecha/hora.

### Cache Redis

El endpoint `GET /api/cards/search?q=<texto>` se cachea por 60 segundos.

- Primera llamada → header `X-Cache: MISS`.
- Llamada repetida con la misma query → `X-Cache: HIT` y respuesta inmediata desde Redis.

### Pruebas manuales (Postman/cURL)

Consulta `docs/POSTMAN_TESTS.md` para un guion rápido de pruebas de autenticación, creación/aprobación de publicaciones y verificación del caché con encabezados `X-Cache`. Incluye los cuerpos de ejemplo y los tokens requeridos para cada rol.

### Semillas / usuarios de ejemplo

- Crear un administrador rápido: `node scripts/createAdmin.js admin@example.com admin123` (requiere MongoDB iniciado y variables de entorno cargadas). Con Docker: `docker compose exec api node scripts/createAdmin.js admin@example.com admin123`.
- La semilla `scripts/create_fake_listings.js` puede poblar cartas y vendedores falsos si necesitas datos de prueba adicionales.
