const server = require('./socket/socket.js');
const PORT = process.env.PORT || 4000;

server.listen(PORT, (err) => {
    if (!err) {
        console.log(`PORT:${PORT}`);
    }
})