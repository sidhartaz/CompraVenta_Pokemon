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
