// index.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { MongoClient } = require('mongodb');
const config = require('./config.js'); // guarda token e clientId

// Inicializa cliente Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Conexão MongoDB
const mongo = new MongoClient('mongodb://localhost:27017');
let db;
client.once('ready', async () => {
  await mongo.connect();
  db = mongo.db('loja');
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// Carregar comandos (exemplo simples)
client.commands = new Collection();
client.commands.set('painel', require('./commands/painel.js'));
client.commands.set('cupom', require('./commands/cupom.js'));
client.commands.set('fecharcarrinho', require('./commands/fecharcarrinho.js'));

// Listener de interações
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) {
      await command.execute(interaction, db);
    }
  }

  // Select menu e botões ficam em interactions/
  if (interaction.isStringSelectMenu()) {
    const selectHandler = require('./interactions/selectProduto.js');
    await selectHandler(interaction, db);
  }

  if (interaction.isButton()) {
    const buttonHandler = require('./interactions/buttons.js');
    await buttonHandler(interaction, db);
  }
});

// Login
client.login(config.token);