const mongoose = require('mongoose');

const ProdutoSchema = new mongoose.Schema({
    id: String, 
    nome: String,
    descricao: String,
    preco: String, // Texto para aceitar "R$ 20,00"
    imagem: String,
    linkPagamento: String // O link do seu QR Code ou Checkout
});

module.exports = mongoose.model('Produto', ProdutoSchema);
