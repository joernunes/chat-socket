// Importa as bibliotecas necessárias
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');

// Cria um servidor HTTP básico
const httpServer = http.createServer((req, res) => {
  // Se a requisição for para a página principal, sirva o index.html
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Erro ao carregar index.html');
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
  }
});

// Inicia o servidor Socket.IO em cima do servidor HTTP
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permite requisições de qualquer origem (mais flexível para desenvolvimento)
    methods: ["GET", "POST"]
  }
});

// Mantém uma lista de apelidos dos usuários online
let onlineUsers = [];

// Função para emitir a lista de usuários atualizada para todos
const broadcastOnlineUsers = () => {
  io.emit('atualizarListaUsuarios', onlineUsers);
};

// Evento que dispara quando um novo cliente se conecta
io.on('connection', (socket) => {
  console.log('Um usuário se conectou!');

  // Novo evento para o cliente definir seu apelido
  socket.on('definirApelido', (apelido) => {
    socket.apelido = apelido;
    onlineUsers.push(apelido);
    // Anuncia a entrada do novo usuário com seu apelido
    socket.broadcast.emit('mensagemDoServidor', `➡️ ${apelido} entrou no chat.`);
    // Envia a lista de usuários atualizada para todos
    broadcastOnlineUsers();
  });

  // Evento que dispara quando o cliente se desconecta
  socket.on('disconnect', () => {
    // Só anuncia a saída se o usuário tiver definido um apelido
    if (socket.apelido) {
      console.log(`Usuário ${socket.apelido} se desconectou!`);
      // Remove o usuário da lista
      onlineUsers = onlineUsers.filter(user => user !== socket.apelido);
      io.emit('mensagemDoServidor', `⬅️ ${socket.apelido} saiu do chat.`);
      // Envia a lista de usuários atualizada para todos
      broadcastOnlineUsers();
    } else {
      console.log('Um usuário anônimo se desconectou!');
    }
  });

  // Fica "ouvindo" pelo evento 'mensagemDoCliente'
  socket.on('mensagemDoCliente', (msg) => {
    // Só processa a mensagem se o usuário tiver um apelido
    if (socket.apelido) {
      console.log(`Mensagem de ${socket.apelido}: ${msg}`);
      // Adiciona o apelido antes da mensagem e reenvia para todos
      io.emit('mensagemDoServidor', `${socket.apelido}: ${msg}`);
    }
  });
});

// O servidor HTTP começa a "escutar" por conexões na porta 3000
httpServer.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});