// No topo do seu código
require('dotenv').config();

// Use assim:
client.login(process.env.TOKEN);
mongoose.connect(process.env.MONGO_URI);
