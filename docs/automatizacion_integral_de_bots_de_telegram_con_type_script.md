# Automatización integral de bots de Telegram con TypeScript

## 1. Objetivo

Construir un **"BotFather personal"** totalmente automatizado que permita, desde **TypeScript**, realizar:

- Creación de bots de Telegram sin intervención manual.
- Creación de grupos y supergrupos (foros) y gestión de topics.
- Obtención automática de *bot tokens*, *chat IDs*, *topic IDs* y demás valores críticos.
- Creación de un repositorio GitHub desde un template.
- Despliegue automático del bot en **Coolify**, incluyendo variables de entorno y auto‑deploy.

El objetivo final es eliminar el *setup manual* y dejar un pipeline reproducible y escalable.

---

## 2. Qué se puede y NO se puede hacer según la API de Telegram

### 2.1 Bot API (HTTP – bots)

**Disponible:**

- Enviar/recibir mensajes.
- Gestionar grupos *si el bot ya está añadido*.
- Crear y gestionar **forum topics** (`createForumTopic`).
- Obtener información de chats (`getChat`, `getChatMember`).
- Moderación (ban, pin, permisos, etc.).

**NO disponible (limitaciones duras):**

- ❌ Crear bots.
- ❌ Crear grupos o supergrupos.
- ❌ Iniciar conversaciones con usuarios.
- ❌ Obtener listado de topics existentes.

👉 La Bot API **NO sirve** para el bootstrap inicial.

---

### 2.2 Telegram API (MTProto – cuenta de usuario)

**Disponible:**

- Enviar mensajes como un usuario (incluido a @BotFather).
- Crear bots interactuando con @BotFather.
- Crear grupos y supergrupos.
- Convertir grupos en supergrupos (megagroups).
- Añadir bots como administradores.
- Obtener IDs reales de chats.

**Consideraciones:**

- Requiere `api_id` y `api_hash`.
- Necesita login por código SMS.
- Es la **única vía** para automatizar la creación completa.

---

## 3. Arquitectura recomendada (TypeScript)

```
Bootstrap Service (MTProto)
 ├─ Crear bot vía BotFather
 ├─ Crear supergrupo
 ├─ Añadir bot como admin
 ├─ Extraer IDs y tokens
 └─ Provisionar infra (GitHub + Coolify)

Bot Runtime (Bot API)
 └─ Telegraf / grammY
```

Separar **bootstrap** y **runtime** es clave.

---

## 4. Librerías disponibles en TypeScript

### 4.1 Telegram API (MTProto)

**GramJS (recomendada)**

- Cliente MTProto completo para Node.js.
- Permite login como usuario.
- Permite hablar con @BotFather.
- Permite crear chats y canales.

```ts
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
```

Alternativas:

- TDLib (más compleja, overkill).
- Telethon (Python, no TS).

---

### 4.2 Bot API

**Telegraf**

- Muy madura.
- Ideal para bots productivos.

**grammY**

- Más moderna.
- Mejor tipado TS.
- Más flexible para middlewares.

---

## 5. Flujo técnico detallado (Telegram)

### 5.1 Crear bot automáticamente

Usando **Telegram API** (usuario):

1. Login con `api_id + api_hash`.
2. Abrir chat con `@BotFather`.
3. Enviar `/newbot`.
4. Responder nombre y username.
5. Parsear el mensaje que contiene el **BOT TOKEN**.

> El token se guarda como variable de entorno.

---

### 5.2 Crear supergrupo (forum)

Usando Telegram API:

- Crear un **megagroup**.
- Activar modo foro.
- Obtener `chat_id` (ej: `-100xxxxxxxxxx`).

---

### 5.3 Añadir bot como administrador

- Invitar el bot por username.
- Asignar permisos:
  - `can_manage_topics`
  - `can_delete_messages`

---

### 5.4 Crear topics

Usando **Bot API**:

```http
POST https://api.telegram.org/bot<TOKEN>/createForumTopic
```

Payload:

```json
{
  "chat_id": -1001234567890,
  "name": "logs"
}
```

Respuesta contiene:

- `message_thread_id` → ID del topic.

---

## 6. Integración con GitHub (TypeScript)

### 6.1 Crear repositorio desde template

HTTP REST:

```http
POST /repos/{template_owner}/{template_repo}/generate
```

Payload:

```json
{
  "owner": "mi-user",
  "name": "telegram-bot-prod",
  "private": true
}
```

Resultado:

- Repo creado.
- Listo para deploy.

---

## 7. Coolify (sección extensa)

### 7.1 Qué aporta Coolify

- Docker builder.
- Git‑based deploy.
- Variables de entorno.
- Auto‑deploy.
- Logs centralizados.

Perfecto para bots.

---

### 7.2 Autenticación

- Crear **API Token** desde el panel.
- Todas las llamadas usan:

```
Authorization: Bearer <COOLIFY_TOKEN>
```

---

### 7.3 Crear aplicación automáticamente

Endpoint típico:

```http
POST /applications/private-deploy-key
```

Payload:

```json
{
  "project_uuid": "...",
  "server_uuid": "...",
  "environment_uuid": "...",
  "git_repository": "https://github.com/user/bot",
  "git_branch": "main",
  "name": "telegram-bot"
}
```

Esto:

- Clona repo.
- Ejecuta Dockerfile.
- Despliega.

---

### 7.4 Variables de entorno (CRÍTICO)

Variables típicas:

- `BOT_TOKEN`
- `CHAT_ID`
- `LOG_TOPIC_ID`
- `NODE_ENV=production`

Se pueden crear vía API:

```http
POST /applications/{uuid}/envs
```

Esto permite **inyección completa automática**.

---

### 7.5 Auto‑deploy

Opciones:

- GitHub App (recomendado).
- Webhook manual.

Resultado:

- Push a `main` → deploy automático.

---

### 7.6 Arquitectura final

```
User Script (TS)
 ├─ Telegram API
 ├─ GitHub API
 └─ Coolify API

Bot Runtime
 └─ Telegraf / grammY
```

---

## 8. Conclusión

- **No es posible** hacerlo solo con Bot API.
- **Sí es posible** usando Telegram API + Bot API.
- TypeScript tiene tooling suficiente.
- Coolify es perfectamente automatizable.

Este enfoque permite crear bots, infra y despliegues en **un solo comando**.

---

## 9. Referencias

- Telegram Bot API [https://core.telegram.org/bots/api](https://core.telegram.org/bots/api)

- Telegram API (MTProto) [https://core.telegram.org/api](https://core.telegram.org/api)

- GramJS [https://gram.js.org/](https://gram.js.org/)

- Telegraf [https://telegraf.js.org/](https://telegraf.js.org/)

- grammY [https://grammy.dev/](https://grammy.dev/)

- GitHub REST API – Templates [https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template](https://docs.github.com/en/rest/repos/repos#create-a-repository-using-a-template)

- Coolify API [https://coolify.io/docs/api-reference](https://coolify.io/docs/api-reference)

