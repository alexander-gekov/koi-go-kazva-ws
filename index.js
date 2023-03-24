import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";
import cors from 'cors';

const app = express();

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!')
});

const httpServer = createServer(app);
const io = new Server(httpServer, {  
    cors: {
    origin: '*',
    methods: ['GET', 'POST'],}
});

const rooms = {};

io.on('connection', (socket) => {
    socket.on('message', (data) => {
        switch (data['message']) {
            case 'create':
                socket.join(data['room'])
                rooms[data['room']] = data['data']
                rooms[data['room']].owner = socket.id;
                rooms[data['room']].players = [data['username']];
                break;
            case 'join':
                socket.join(data['room'])
                const roomId = data['room']
                if(rooms[roomId]) {
                    rooms[roomId].players.push(data['username'])
                    socket.emit('message', {message: 'loadGameData', data: rooms[roomId]})
                    socket.emit('message', {message: 'loadPlayers', data: [... new Set(rooms[roomId].players)]})
                    socket.to(roomId).emit('message', {message: 'loadPlayers', data: [... new Set(rooms[roomId].players)]})
                }
                break
            case 'leave':
                socket.leave(data['room'])
                if(socket.rooms.size == 0) {
                    delete rooms[data['room']]
                }
                break
        }
    })

    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => {
            if(rooms[room]){
                rooms[room].players.splice(rooms[room].players.indexOf(socket.id), 1)
                socket.to(room).emit('message', {message: 'loadPlayers', data: [... new Set(rooms[room].players)]})
            }
        })
        console.log('user ' + socket.id + ' disconnected');
      });
})

httpServer.listen(8080, () => {
    console.log('listening on *:8080');
})

