# Sistema de Gestión de Tareas - Frontend Angular

Este repositorio contiene la aplicación cliente construida con **Angular (v17+)** para interactuar con los microservicios backend de gestión de usuarios y tareas. La interfaz es moderna, responsiva (basada en Bootstrap 5) y utiliza **Signals** de Angular para la reactividad de estados.

---

## 🛠️ Requisitos Previos

Antes de inicializar la aplicación, asegúrate de tener instalado:
* **Node.js** (versión LTS recomendada, v18 o superior).
* **npm** (instalador de paquetes de Node, que viene por defecto con Node.js).
* **Angular CLI** (opcional, para comandos globales de Angular: `npm install -g @angular/cli`).

---

## 🚀 Instrucciones de Inicialización

Sigue estos pasos para instalar y ejecutar el frontend localmente:

1. **Abrir la terminal** en el directorio raíz de este proyecto (`C:\Users\mmale\taskManagement`).
2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```
3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *(También puedes utilizar `ng serve` si tienes Angular CLI instalado de forma global).*
4. **Abrir el navegador web:**
   Una vez que compile correctamente, ve a la dirección URL:
   [http://localhost:4200](http://localhost:4200)

---

## ⚙️ Conexión con Microservicios Backend

La aplicación está preconfigurada para conectarse a los microservicios locales en HTTP (evitando problemas de certificados SSL de localhost):
* **Microservicio Usuarios:** `http://localhost:5001/api/users`
* **Microservicio Tareas:** `http://localhost:5002/api/workitems`

> [!IMPORTANT]
> Asegúrate de que ambos microservicios backend estén iniciados y corriendo en sus respectivos puertos antes de utilizar la aplicación en el navegador.

---

## 🌟 Características de la Aplicación

El frontend contiene las siguientes vistas y funciones en su Dashboard:

1. **Monitoreo de Microservicios (Overview):**
   * Semáforo de salud de conexión en vivo con cada microservicio.
   * Botón para **"Cargar Escenario Inicial"** que restablece y limpia las bases de datos sembrando los datos base de la prueba.
   * Lista en tiempo real de **Tareas Pendientes de Asignación** en color rojo con un botón para gatillar su auto-asignación inteligente con el motor de reglas C#.
   * Registro histórico de logs explicativos de las reglas aplicadas en cada asignación.

2. **Gestión de Usuarios:**
   * Lista detallada de usuarios con roles.
   * Formulario para crear nuevos usuarios o modificar usuarios existentes presionando el botón de edición (lápiz azul ✏️).

3. **Gestión de Tareas (Ítems de Trabajo):**
   * Panel de creación de tareas con opción de asignarlas manualmente al instante, o bien crearlas sin asignar para luego utilizar el motor de auto-asignación.
   * Listado general de tareas con filtros rápidos (Todas, Pendientes, Asignadas, Completadas).
   * Semáforo de estado de tareas: **Rojo** (Pendiente), **Amarillo** (Asignado), **Verde** (Completado).
   * Modificación de tareas existentes (lápiz azul ✏️), eliminación (tacho rojo 🗑️) y marcado de completado.
