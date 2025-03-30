const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'chat.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const admin = { id: "admin", name: "Grpc_Admin", email: "grpc_admin@mail.com", status: "ACTIVE" };
const messages = [];

function getUser(call, callback) {
  callback(null, { user: { ...admin, id: call.request.user_id } });
}

function chat(call) {
  call.on('data', (chatStreamMessage) => {
    if (chatStreamMessage.chat_message) {
      messages.push(chatStreamMessage.chat_message);
      call.write({ chat_message: chatStreamMessage.chat_message });
    }
  });
  call.on('end', () => call.end());
}

function getChatHistory(call, callback) {
  const roomMessages = messages.filter(msg => msg.room_id === call.request.room_id);
  callback(null, { messages: roomMessages });
}

function main() {
  const server = new grpc.Server();
  server.addService(chatProto.ChatService.service, { GetUser: getUser, Chat: chat, GetChatHistory: getChatHistory });
  server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => console.log("Serveur gRPC démarré."));
}

main();