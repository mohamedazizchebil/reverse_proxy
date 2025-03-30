const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const WebSocket = require('ws');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'chat.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

function createGrpcClient() {
  return new chatProto.ChatService('localhost:50051', grpc.credentials.createInsecure());
}

const wss = new WebSocket.Server({ port: 8080 });
console.log('Proxy WebSocket en écoute sur ws://localhost:8080');

wss.on('connection', (ws) => {
  console.log('Client WebSocket connecté.');
  const grpcClient = createGrpcClient();
  const grpcStream = grpcClient.Chat();

  grpcStream.on('data', (message) => ws.send(JSON.stringify(message)));
  grpcStream.on('end', () => ws.close());

  ws.on('message', (message) => grpcStream.write(JSON.parse(message)));
  ws.on('close', () => grpcStream.end());
});