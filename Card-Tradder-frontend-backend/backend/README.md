# Card-Tradder – Backend

Backend en **Node.js + Express + MongoDB** para la plataforma de intercambio y venta de cartas coleccionables.

## Requisitos

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

Ajusta `MONGO_URI` si es necesario.

## Ejecución

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000` y servirá el frontend desde `../frontend/public`.
