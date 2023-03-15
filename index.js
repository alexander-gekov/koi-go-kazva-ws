import express from 'express';
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    return "Hello World";
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
                rooms[data['room']].owner = socket.id
                break;
            case 'join':
                socket.join(data['room'])
                const roomId = data['room']
                if(rooms[roomId]) {
                    socket.emit('message', {message: 'loadGameData', data: rooms[roomId]})
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

    socket.on('disconnect', () => {
        console.log('user ' + socket.id + ' disconnected');
      });
})

httpServer.listen(8080, () => {
    console.log('listening on *:8080');
})

