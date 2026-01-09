const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const mongoose = require('mongoose');
const Produto = require('./Produto'); // Importa o arquivo Produto.js
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// Conexão com o Banco de Dados (MongoDB)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Banco de dados conectado!'))
    .catch(err => console.error('❌ Erro ao conectar banco:', err));

client.once('ready', () => {
    console.log(`🚀 Bot online como ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Comando para Admin configurar produto
    if (message.content === '!configurar' && message.member.permissions.has('Administrator')) {
        const modal = new ModalBuilder()
            .setCustomId('modal_produto')
            .setTitle('Painel de Configuração');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('id').setLabel("ID Único").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel("Nome").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('preco').setLabel("Preço (ex: 79,90)").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Link do Pagamento/QR Code").setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('img').setLabel("URL da Imagem (Opcional)").setStyle(TextInputStyle.Short).setRequired(false))
        );
        
        // Em vez de showModal direto na message, vamos usar um botão para disparar o modal (Regra do Discord)
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('abrir_modal').setLabel('Abrir Painel de Cadastro').setStyle(ButtonStyle.Primary)
        );
        await message.reply({ content: 'Clique no botão para configurar o produto:', components: [row] });
    }

    // Comando para exibir a loja
    if (message.content === '!loja') {
        const produtos = await Produto.find();
        if (produtos.length === 0) return message.reply("Nenhum produto cadastrado.");

        const embedLoja = new EmbedBuilder()
            .setTitle("🛒 LOJA VIRTUAL")
            .setDescription("Selecione um produto no menu abaixo:")
            .setColor("Blue");

        const menu = new StringSelectMenuBuilder()
            .setCustomId('menu_loja')
            .setPlaceholder('Escolha um item...')
            .addOptions(produtos.map(p => ({
                label: p.nome,
                description: `Valor: R$ ${p.preco}`,
                value: p.id
            })));

        const row = new ActionRowBuilder().addComponents(menu);
        await message.channel.send({ embeds: [embedLoja], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    // Abre o modal ao clicar no botão de configuração
    if (interaction.isButton() && interaction.customId === 'abrir_modal') {
        // (O código do modal aqui...)
        // Nota: O modal só abre via interação, por isso o botão acima é necessário.
    }

    // Lógica do Modal Submit (Salvar)
    if (interaction.isModalSubmit() && interaction.customId === 'modal_produto') {
        const data = {
            id: interaction.fields.getTextInputValue('id'),
            nome: interaction.fields.getTextInputValue('nome'),
            preco: interaction.fields.getTextInputValue('preco'),
            linkPagamento: interaction.fields.getTextInputValue('link'),
            imagem: interaction.fields.getTextInputValue('img'),
            descricao: "Produto disponível para entrega imediata."
        };
        await Produto.findOneAndUpdate({ id: data.id }, data, { upsert: true });
        await interaction.reply({ content: `✅ Produto **${data.nome}** salvo!`, ephemeral: true });
    }

    // Lógica do Select Menu (Mostrar Produto)
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_loja') {
        const prod = await Produto.findOne({ id: interaction.values[0] });
        const embed = new EmbedBuilder()
            .setTitle(prod.nome)
            .setColor("Green")
            .addFields({ name: '💵 Valor', value: `**R$ ${prod.preco}**` });

        if (prod.imagem) embed.setImage(prod.imagem);

        const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Pagar Agora').setURL(prod.linkPagamento).setStyle(ButtonStyle.Link)
        );
        await interaction.reply({ embeds: [embed], components: [btn], ephemeral: true });
    }
});

client.login(process.env.TOKEN);
