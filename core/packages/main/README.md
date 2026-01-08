# @mks2508/telegram-bot-manager

CLI & Library for automating Telegram BotFather operations via GramJS MTProto.

## Features

- **Create bots** via @BotFather automatically
- **Create supergroups** with forum mode enabled
- **Manage forum topics** (create, delete, configure)
- **Multi-bot management** with environment configs
- **Interactive CLI** with spinners and prompts

## Installation

### As CLI (npx)

```bash
# Bootstrap a new bot interactively
npx @mks2508/telegram-bot-manager bootstrap

# List bots from BotFather
npx @mks2508/telegram-bot-manager bootstrap --list

# Manage configured bots
npx @mks2508/telegram-bot-manager bot list
npx @mks2508/telegram-bot-manager bot use mybot123bot

# Configure bot via BotFather
npx @mks2508/telegram-bot-manager configure commands mybot123bot
npx @mks2508/telegram-bot-manager configure description mybot123bot

# Create forum topics
npx @mks2508/telegram-bot-manager topics
```

### As Library

```bash
npm install @mks2508/telegram-bot-manager
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `bootstrap` | Interactive bot setup wizard |
| `bootstrap --list` | Import bots from BotFather |
| `bot list` | List configured bots |
| `bot use <name>` | Set active bot |
| `bot info <name>` | Show bot details |
| `bot delete <name>` | Delete bot config |
| `bot migrate` | Migrate old .env files |
| `configure commands` | Set bot commands |
| `configure description` | Set bot description |
| `configure about` | Set bot about text |
| `configure name` | Set bot display name |
| `topics` | Create forum topics |

## Library Usage

```typescript
import {
  BootstrapClient,
  BotFatherManager,
  GroupManager,
  TopicManager,
  EnvManager,
} from '@mks2508/telegram-bot-manager'

// Connect to Telegram via MTProto
const client = new BootstrapClient({
  apiId: 12345,
  apiHash: 'your_api_hash',
})
await client.ensureAuthorized()

// Create a bot via BotFather
const botFather = new BotFatherManager(client)
const result = await botFather.createBot({
  botName: 'My Bot',
  botUsername: 'mybot123bot',
})

if (result.success) {
  console.log('Bot created:', result.botToken)
}

// List all your bots
const bots = await botFather.getAllBotsWithTokens()
console.log('Your bots:', bots)

// Create a supergroup with forum mode
const groupManager = new GroupManager(client)
const group = await groupManager.createSupergroup({
  title: 'My Bot Control',
  forumMode: true,
})

// Create topics
const topicManager = new TopicManager(result.botToken)
await topicManager.createTopics(group.chatId, ['General', 'Logs', 'Control'])

// Manage bot configurations
const envManager = new EnvManager()
await envManager.createEnv('mybot123bot', 'local', {
  botToken: result.botToken,
  controlChatId: String(group.chatId),
})
```

## API Reference

### BootstrapClient

GramJS client wrapper for Telegram MTProto operations.

```typescript
const client = new BootstrapClient({ apiId, apiHash })
await client.ensureAuthorized() // Interactive login
await client.disconnect()
```

### BotFatherManager

Automate @BotFather interactions.

```typescript
const botFather = new BotFatherManager(client)

// List bots
const bots = await botFather.listBots()

// Create bot
const result = await botFather.createBot({ botName, botUsername })

// Get all bots with tokens
const botsWithTokens = await botFather.getAllBotsWithTokens()

// Configure bot
await botFather.setCommands(username, commands)
await botFather.setDescription(username, description)
await botFather.setAboutText(username, aboutText)
await botFather.setName(username, displayName)
```

### GroupManager

Create and manage Telegram groups/forums.

```typescript
const groupManager = new GroupManager(client)

// Get user's forums
const forums = await groupManager.getUserForums()

// Create supergroup
const result = await groupManager.createSupergroup({
  title: 'My Group',
  forumMode: true,
})

// Add bot as admin
await groupManager.addBotAsAdmin(chatId, botUsername, {
  canManageTopics: true,
  canDeleteMessages: true,
})

// Get topics
const topics = await groupManager.getForumTopics(chatId)
```

### TopicManager

Create forum topics using Bot API.

```typescript
const topicManager = new TopicManager(botToken)

// Create single topic
const result = await topicManager.createTopic(chatId, 'Logs')

// Create multiple topics
const results = await topicManager.createTopics(chatId, [
  'General',
  'Logs',
  'Control',
  'Config',
])
```

### EnvManager

Manage multi-bot environment configurations.

```typescript
const envManager = new EnvManager()

// List configured bots
const bots = envManager.listBots()

// Get/set active bot
const active = envManager.getActiveBot()
await envManager.setActiveBot('mybot123bot')

// CRUD operations
await envManager.createEnv('mybot', 'local', { botToken, ... })
const config = await envManager.readEnv('mybot', 'local')
await envManager.updateEnv('mybot', 'local', { ... })
await envManager.deleteBot('mybot')

// Migrate old .env files
await envManager.migrateOldEnvs()
```

## Requirements

- Node.js >= 18.0.0
- Telegram API credentials from https://my.telegram.org

## License

MIT
