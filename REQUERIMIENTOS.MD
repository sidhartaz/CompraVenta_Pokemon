# REQUERIMIENTOS DEL PROYECTO DE INTERCAMBIO Y VENTA DE CARTAS COLECCIONABLES

Versión: 1.1  
Autores: Carlos Sepúlveda, Bryam Beltrán

---

## 1. Descripción del Cliente y Problema Principal

El cliente corresponde a un grupo de emprendedores dedicados al coleccionismo e intercambio de cartas de distintos juegos reconocidos a nivel mundial, tales como Pokémon, Mitos y Leyendas y Yu-Gi-Oh!. Actualmente, este grupo administra diversas comunidades en redes sociales y foros, donde los usuarios publican sus cartas para vender, intercambiar o subastar.

Durante las reuniones iniciales, el cliente manifestó que el principal problema radica en la falta de una plataforma unificada y segura que centralice todas las actividades relacionadas con la compra, venta y validación de cartas. En los espacios actuales, las transacciones suelen realizarse de manera informal, lo que genera múltiples dificultades, entre ellas:

* Riesgo de fraudes o falsificaciones de cartas.
* Dificultad para verificar la autenticidad y el estado de los artículos.
* Falta de un historial o trazabilidad de los intercambios.
* Desconfianza entre compradores y vendedores.

Ante esta situación, el cliente solicitó el desarrollo de un sistema web especializado que permita a los coleccionistas:

* Crear un perfil personal con información básica y su inventario de cartas.
* Publicar cartas disponibles para la venta o intercambio.
* Participar en subastas y trueques de manera controlada.
* Acceder a un sistema de validación y reputación que garantice la seguridad de las operaciones.

El objetivo principal del cliente es consolidar una comunidad digital confiable donde los usuarios puedan realizar transacciones de manera transparente, eficiente y segura, fortaleciendo el mercado del coleccionismo y mejorando la experiencia general de los participantes.

---
## 2. Lista de Usuarios del Sistema

* **Administrador**
  * Supervisa la plataforma y valida autenticidad de cartas.
  * Permisos: Crear, editar y eliminar usuarios y publicaciones; aprobar ventas.

* **Vendedor**
  * Publica cartas y gestiona sus ventas o intercambios.
  * Permisos: Registrar productos, modificar precios, consultar ventas.

* **Cliente**
  * Navega, compra e intercambia cartas.
  * Permisos: Buscar cartas, realizar compras o intercambios, dejar reseñas.

* **Usuario**
  * Rol genérico que permite el acceso inicial al sistema y funcionalidades básicas.
  * Permisos: Registrarse, completar perfil y consultar catálogo de cartas.

---

## 3. Funciones necesarias

**Incluye:**

* Registro y autenticación de usuarios.
* Publicación y gestión de cartas.
* Compra, venta e intercambio de cartas.
* Validación de autenticidad por el administrador.
* Notificaciones de estado de publicación y transacción.

---

## 4. Requerimientos Funcionales (RF)

| Código | Requerimiento                                                                                                      | Prioridad |
| ------ | ------------------------------------------------------------------------------------------------------------------ | --------- |
| RF-01  | El sistema debe permitir el registro de nuevos usuarios con validación de rol (cliente, vendedor o administrador). | Alta      |
| RF-02  | El vendedor podrá publicar cartas con nombre, tipo de juego, condición, imagen y precio.                           | Alta      |
| RF-03  | El administrador debe revisar y aprobar las publicaciones antes de que sean visibles.                              | Alta      |
| RF-04  | Los clientes podrán realizar compras y reservas de cartas disponibles.                                             | Alta      |
| RF-05  | El sistema debe registrar un historial de transacciones por usuario.                                               | Alta      |
| RF-06  | El administrador podrá suspender cuentas o publicaciones que incumplan normas.                                     | Alta      |
| RF-07  | El vendedor podrá actualizar o eliminar sus publicaciones.                                                         | Media     |
| RF-08  | El cliente podrá dejar reseñas y calificaciones después de una compra.                                             | Baja      |

---

## 5. Requerimientos No Funcionales (RNF)

| Código | Categoría      | Requerimiento                                                                   | Prioridad |
| ------ | -------------- | ------------------------------------------------------------------------------- | --------- |
| RNF-01 | Seguridad      | Las contraseñas deben almacenarse cifradas y la comunicación usar HTTPS.        | Alta      |
| RNF-02 | Rendimiento    | El tiempo de respuesta máximo debe ser inferior a 2 segundos por solicitud.     | Media     |
| RNF-03 | Disponibilidad | El sistema debe mantener un 99 % de disponibilidad mensual.                     | Alta      |
| RNF-04 | Escalabilidad  | La aplicación debe permitir la incorporación futura de más juegos y categorías. | Media     |
| RNF-05 | Mantenibilidad | El código debe estar documentado y seguir buenas prácticas de desarrollo.       | Media     |

---
## 6. Datos a Guardar

### Usuarios

* Nombre
* Rol (Administrador, Vendedor, Cliente, Usuario)
* Permisos
* Hash de contraseña

### Clientes

* ID
* Nombre
* RUT/Identificación
* Contacto
* Historial de compras
* Método de pago

### Vendedores

* ID
* Nombre
* RUT/Identificación
* Contacto
* Historial de ventas
* Estado de suscripción

### Tipo de Carta

* Juego (e.g., Pokémon, Yu-Gi-Oh)
* Valor estimado
* Calidad (grading)
* Autentificación / Estado de verificación

---

## 7. Reglas de Negocio

* El vendedor sólo podrá estar visible al público si paga una suscripción semanal.
* Los clientes solo pueden publicar y comprar 2 cartas a la semana.
* Las cartas deben ser verificadas por un administrador antes de publicarse.
* Si un cliente reserva y no paga en 1 día, se anulará la reserva.
* Los trueques deben ser aceptados por ambas partes.
* Las subastas deben ser supervisadas por un administrador.
* Toda publicación rechazada debe indicar el motivo.
* El sistema registrará cada cambio de estado (auditoría básica).

---

## 8. Prioridades

* **Alta:** Gestión de usuarios, validación de cartas, procesamiento de pagos  
* **Media:** Reservas  
* **Baja:** Trueques, subastas

---

## 9. Flujos Principales

### 9.1 Flujo de Publicación de Carta

1. El vendedor inicia sesión.
2. Publica una carta con sus detalles.
3. El administrador revisa la publicación.
4. Si la aprueba → la carta se muestra en el catálogo.
5. Si la rechaza → se notifica al vendedor con el motivo.

### 9.2 Flujo de Compra

1. El cliente selecciona una carta disponible.
2. Realiza la compra o reserva.
3. Se notifica al vendedor y al administrador.
4. Se actualiza el inventario y el historial del usuario.

---

## 10. Requerimientos Técnicos

* Lenguaje backend: Node.js (para MongoDB + Redis + JWT)
* Base de datos: MongoDB
* Cache: Redis para mejorar rendimiento
* Frontend: React.js o Vue.js (interfaz responsiva)
* Servidor: Localhost en desarrollo; Azure/AWS en producción
* Control de versiones: Git y GitHub
* Arquitectura: Cliente–Servidor con API REST

---

## 12. Presupuesto Estimado

**1. Desarrollo del MVP (4–6 semanas)**

| Concepto                            | Detalle                                                        | Costo aproximado |
| ---------------------------------- | -------------------------------------------------------------- | --------------- |
| Backend + API                       | Node.js + MongoDB + Redis + JWT                                 | $1.500.000 CLP (~US$1.650) |
| Frontend                             | React.js/Vue.js responsivo                                     | $1.200.000 CLP (~US$1.320) |
| Integración y pruebas               | Testing, correcciones y validaciones                            | $500.000 CLP (~US$550) |
| Documentación y GitHub               | README, requisitos, diseño y flujo de desarrollo               | $200.000 CLP (~US$220) |

**Subtotal Desarrollo MVP:** $3.400.000 CLP (~US$3.740)

---

**2. Infraestructura (mensual)**

| Concepto                  | Detalle                                           | Costo mensual aproximado |
| ------------------------- | ------------------------------------------------- | ----------------------- |
| Hosting / Servidor Cloud   | Azure/AWS (1 instancia para API + DB)            | $100.000 CLP (~US$110) |
| Base de datos (MongoDB)    | Servicio gestionado o VPS                         | $50.000 CLP (~US$55) |
| Redis (cache)              | Servicio gestionado o VPS                         | $20.000 CLP (~US$22) |
| Dominio y certificados SSL | Dominio .cl y certificado SSL                     | $15.000 CLP (~US$16.5) |

**Subtotal Infraestructura mensual:** $185.000 CLP (~US$203.5)

---

**3. Suscripción y monetización**

* Cliente/usuario: gratis  
* Vendedor: $3.000 CLP / semana (~US$3.3 / semana, ~$12.000 CLP / mes ~US$13.2 / mes)  

---

**4. Mantenimiento y Soporte (mensual)**

| Concepto                  | Detalle                                | Costo mensual aproximado |
| ------------------------- | -------------------------------------- | ----------------------- |
| Monitoreo y soporte       | Resolución de bugs, uptime y seguridad | $150.000 CLP (~US$165) |
| Actualizaciones y mejoras | Funcionalidades y optimización         | $100.000 CLP (~US$110) |

**Subtotal Mantenimiento:** $250.000 CLP (~US$275)

---

**5. Total estimado primer mes:**  
Desarrollo MVP + infraestructura + mantenimiento inicial: ~$3.400.000 + $185.000 + $250.000 ≈ **$3.835.000 CLP (~US$4.218.5)**

> Este presupuesto incluye desarrollo, infraestructura y mantenimiento básico, considerando la monetización vía suscripción semanal de vendedores.

---

## 13. Propuesta Formal y Cronograma de Trabajo

Proponemos el desarrollo de una plataforma web (con potencial para futura aplicación móvil) para la comunidad de coleccionistas. La clave de esta propuesta radica en la seguridad transaccional y la validación de la autenticidad de las cartas, diferenciándonos de plataformas de venta general. El enfoque es crear un mercado vertical y especializado.

**Cronograma de Alto Nivel:**

* Fase I: MVP Hasta 6 de Noviembre – Módulos de Prioridad Alta y Media: Base de datos, seguridad (Login/Registro), Gestión de Usuarios, Publicación y Validación de Cartas, Procesamiento de Pagos.
* Fase II: Expansión Post 6 de Noviembre – Módulos de Prioridad Baja: Implementación y optimización de Trueques y Subastas.
* Fase III: Estabilización Continua – Pruebas de carga, mejoras de experiencia de usuario y optimización de rendimiento.

---
