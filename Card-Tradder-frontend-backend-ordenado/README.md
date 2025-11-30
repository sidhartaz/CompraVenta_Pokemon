# Card-Tradder – Estructura separada Frontend / Backend

Este proyecto se ha reorganizado para separar claramente:

- `backend/` → API en Node.js + Express + MongoDB
- `frontend/` → Sitio web (HTML, CSS, JS estático) servido por el backend

## Cómo ejecutar

1. Entra al backend:

```bash
cd backend
npm install
cp .env.example .env   # y ajusta MONGO_URI si es necesario
npm start
```

2. Abre en el navegador:

```text
http://localhost:3000
```

El backend sirve directamente los archivos estáticos desde `../frontend/public`.

La carpeta `docs/` (dentro de `backend/`) contiene la documentación de requisitos y diseño del proyecto.
