const app = require('../app');
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

class User {
    inGame;
    name;
    id;
    constructor(name = null, id = null) {
        this.inGame = false;
        this.name = name;
        this.id = id;
    }
}
class Game {
    id;
    playerOne = {
        user: null,
        selectedMove: null
    };
    playerTwo = {
        user: null,
        selectedMove: null
    }
    scores = [{
        playerOneScore: null,
        playerTwoScore: null,
        winner: null
    }];
    maxMoves;
    numberActualOfMove;

    constructor(id, playerOne, playerTwo, maxMoves) {
        this.id = id;
        playerOne.score = 0;
        playerTwo.score = 0;
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.scores = []
        this.maxMoves = maxMoves;
        this.numberActualOfMove = 0;
    }
}

class TimerGames {
    id;
    state;
    timer;
    game;
    constructor(game) {
        this.id = game.id;
        this.state = 'waiting';
        this.timer = null;
        this.game = game;
    }

    empezarTimer() {
        console.log('timer start, players game:', this.game.playerOne.user, this.game.playerTwo.user);
        this.timer = setInterval(() => {
            let socketInstance = userIdWithSocketInstance.get(this.game.playerOne.user.id);
            let user = IdWithUser.get(this.game.playerOne.user.id);
            if (socketInstance) {
                socketInstance.emit('gameFinished');
                user.inGame = false;
                IdWithUser.set(user.id, user);
            }
            socketInstance = userIdWithSocketInstance.get(this.game.playerTwo.user.id);
            if (socketInstance) {
                user = IdWithUser.get(this.game.playerTwo.user.id);
                socketInstance.emit('gameFinished');
                user.inGame = false;
                IdWithUser.set(user.id, user);
            }
            enviarUsuariosConectados();
            this.pararTimer();
        }, 15100);
    }

    pararTimer() {
        console.log('se acciono parar el timer.');
        clearInterval(this.timer);
        this.timer = null;
    }
}
//con el ID de game te devuelve un objeto de clase TimerGames
let timerForGames = new Map();
// con un id te da un usuario
let IdWithUser = new Map();
//con un id te da el socket del usuario
let userIdWithSocketInstance = new Map();

io.on("connection", (socket) => {
    //ENVIAR USUARIOS CONECTADOS
    enviarUsuariosConectados();

    socket.on('wantToPlay', (params) => {
        let actualUser = IdWithUser.get(socket.id);
        if (actualUser.inGame)
            return;
        let user = params[0];
        let maxMoves = params[1];
        console.log('user recibido:', user);
        if (user) {
            if (actualUser) {
                actualUser.inGame = true;
                user.inGame = true;
                IdWithUser.set(actualUser.id, actualUser);
                IdWithUser.set(user.id, user);
                enviarUsuariosConectados();
                let playerOne = {
                    user: actualUser,
                    selectedMove: null,
                };
                let playerTwo = {
                    user: user,
                    selectedMove: null,
                };
                let maximosMovimientos = Math.floor(maxMoves / 2) + 1;
                let idForGame = `${socket.id} ${user.id}`;
                let game = new Game(idForGame, playerOne, playerTwo, maximosMovimientos);
                let timeGame = new TimerGames(game);
                timerForGames.set(game.id, timeGame);
                timeGame.empezarTimer();
                //Se le envía la petición para jugar al mismo que inicio el juego para iniciar el timer a la vez.
                socket.emit('requestToPlay');
                userIdWithSocketInstance.get(user.id).emit('requestToPlay', [actualUser, maxMoves]);
            }
        }
    })

    //Se realizo un movimiento en el juego
    socket.on('Move', (game) => {
        if (game) {
            let actualGame = timerForGames.get(game.id);
            actualGame.game = game;
            if (actualGame.game.playerOne.selectedMove != null && actualGame.game.playerTwo.selectedMove != null) {
                console.log('actualGame.game.playerTwo.selectedMove', actualGame.game.playerTwo.selectedMove);
                console.log('actualGame.game.playerOne.selectedMove', actualGame.game.playerOne.selectedMove);
                actualGame.pararTimer();
                let winner = validarMovimientos(actualGame.game.playerOne, actualGame.game.playerTwo);
                if (winner == actualGame.game.playerOne.user.name) {
                    actualGame.game.playerOne.score++;
                    actualGame.game.numberActualOfMove++;
                } else if (winner == actualGame.game.playerTwo.user.name) {
                    actualGame.game.playerTwo.score++;
                    actualGame.game.numberActualOfMove++;
                }
                let score = {
                    playerOneMove: actualGame.game.playerOne.selectedMove,
                    playerTwoMove: actualGame.game.playerTwo.selectedMove,
                    winner
                };
                actualGame.game.scores.push(score);
                actualGame.game.playerOne.selectedMove = null;
                actualGame.game.playerTwo.selectedMove = null;
                if (actualGame.game.numberActualOfMove >= actualGame.game.maxMoves) {
                    juegoFinalizadoEnviarResultados(actualGame.game.playerOne, actualGame.game.playerTwo);
                    timerForGames.delete(actualGame.id);
                    console.log(timerForGames.size);
                    return;
                } else {
                    actualGame.empezarTimer();
                    timerForGames.set(actualGame.id, actualGame);
                }
            }
            userIdWithSocketInstance.get(actualGame.game.playerOne.user.id).emit('result', actualGame.game);
            if (actualGame.game.playerTwo.user.id != 'bot')
                userIdWithSocketInstance.get(actualGame.game.playerTwo.user.id).emit('result', actualGame.game);
        }
    });
    // Aceptaron el juego, por parametro viene el usuario al cual le aceptaron el juego.
    socket.on('gameAccepted', (user) => {
        if (user) {
            if (user.id) {
                let actualGame = null;
                timerForGames.forEach((game, key) => {
                    if (key.split(' ')[0] == user.id || key.split(' ')[1] == user.id) {
                        actualGame = game;
                        return;
                    }
                })
                if (actualGame == null) {
                    return;
                }
                actualGame.state = 'playing';
                timerForGames.set(actualGame.id, actualGame);
                actualGame.pararTimer();
                actualGame.empezarTimer();
                userIdWithSocketInstance.get(user.id).emit('gameStart', actualGame.game);
                socket.emit('gameStart', actualGame.game);
            }
        }
    });

    // Declinaron el juego, por parametro viene el usuario al cual le declinaron el juego.
    socket.on('gameDeclined', (userToNotify) => {
        let userToNotifyExists = userIdWithSocketInstance.get(userToNotify.id);
        console.log(userToNotifyExists);
        if (userToNotifyExists != null) {
            console.log('timerForGames size', timerForGames.size);
            let keyToDelete = null;
            timerForGames.forEach((timerGame, key) => {
                if (key.split(' ')[0] == userToNotify.id || key.split(' ')[1] == userToNotify.id) {
                    let user = IdWithUser.get(timerGame.game.playerOne.user.id);
                    user.inGame = false;
                    user = IdWithUser.set(user.id, user);
                    user = IdWithUser.get(timerGame.game.playerTwo.user.id);
                    user.inGame = false;
                    IdWithUser.set(user.id, user);
                    timerGame.pararTimer();
                    keyToDelete = key;
                    return;
                }
            })
            timerForGames.delete(keyToDelete);
            console.log('timerForGames', timerForGames.length);
            socket.emit('gameWontStart', userToNotify.name);
            userIdWithSocketInstance.get(userToNotify.id).emit('gameWontStart', userToNotify.name);
            enviarUsuariosConectados();
        }
    });

    //EL USUARIO SE LOGEO, ENVIANDO LA LISTA DE USUARIOS CONECTADOS Y SU ID.
    socket.on('userReady', (userReady) => {
        if (userReady.name) {
            console.log(userReady)
            if (!IdWithUser.has(userReady.id)) {
                console.log(userReady.id)
                let user = new User(userReady.name, socket.id);
                IdWithUser.set(user.id, user);
                userIdWithSocketInstance.set(user.id, socket);
                console.log('users on:', JSON.stringify(IdWithUser.values()));
                socket.emit('id', user.id);
                enviarUsuariosConectados();
            }
        }
    });
    socket.on('gameAgainstBot', (game) => {
        let gameAgainstBot = new TimerGames(game);
        gameAgainstBot.empezarTimer();
        timerForGames.set(gameAgainstBot.id, gameAgainstBot);
        let user = IdWithUser.get(socket.id);
        user.inGame = true;
        IdWithUser.set(user.id, user);
        socket.emit('gameStart', gameAgainstBot.game);
    });
    //USUARIO DESCONECTADO
    socket.on('disconnect', () => {
        let user = IdWithUser.get(socket.id);
        if (user) {
            if (user.id != null) {
                if (timerForGames.size > 0) {
                    let idsEnemies = [];
                    timerForGames.forEach((game, key) => {
                        let ids = key.split(' ');
                        //Siempre el ids[1] va a ser el 'bot', sería el id del playerTwo.
                        if ((ids[0] == user.id || ids[1] == user.id) && ids[1] != 'bot') {
                            game.pararTimer()
                            if (ids[0] == user.id)
                                idsEnemies.push(ids[1]);
                            else
                                idsEnemies.push(ids[0]);
                            console.log('borrado:', key);
                            timerForGames.delete(key);
                        }
                    })
                    console.log('my id', user.id);
                    console.log('idsEnemies', idsEnemies);
                    if (idsEnemies.length > 0) {
                        idsEnemies.forEach(idEnemie => {
                            let userToNotify = IdWithUser.get(idEnemie);
                            userToNotify.inGame = false;
                            IdWithUser.set(userToNotify.id, userToNotify);
                            let socketEnemy = userIdWithSocketInstance.get(idEnemie)
                            if (socketEnemy) {
                                socketEnemy.emit("gameFinished", 'desconectado');
                            }
                        })
                    }
                }
                userIdWithSocketInstance.delete(user.id);
                IdWithUser.delete(user.id);
                console.log('se desconecto un usuario, length users:', IdWithUser.size, 'length sockets', userIdWithSocketInstance.size);
                enviarUsuariosConectados();
            }
        }
        socket.disconnect(true);
    });
    //Notificar al adversario que su juego termino.
    socket.on('finishGame', (game) => {
        let actualGame = timerForGames.get(game.id);
        actualGame.pararTimer();
        if (game.playerOne.user.id == socket.id) {
            userIdWithSocketInstance.get(game.playerOne.user.id).emit('gameFinished', 'abandonaste');
            if (game.playerTwo.user.id != 'bot')
                userIdWithSocketInstance.get(game.playerTwo.user.id).emit('gameFinished', 'adversario abandono');
        } else {
            userIdWithSocketInstance.get(game.playerOne.user.id).emit('gameFinished', 'adversario abandono');
            if (game.playerTwo.user.id != 'bot')
                userIdWithSocketInstance.get(game.playerTwo.user.id).emit('gameFinished', 'abandonaste');
        }
        let user = IdWithUser.get(game.playerOne.user.id);
        if (user)
            user.inGame = false;
        IdWithUser.set(user.id, user);
        if (game.playerTwo.user.id != 'bot') {
            user = IdWithUser.get(game.playerTwo.user.id);
            if (user)
                user.inGame = false;
            IdWithUser.set(user.id, user);
        }
        enviarUsuariosConectados();
    })


})

function juegoFinalizadoEnviarResultados(playerOne, playerTwo) {
    console.log('playerOne.score:', playerOne.score);
    console.log('playerTwo.score:', playerTwo.score);
    if (playerOne.score == playerTwo.score) {
        userIdWithSocketInstance.get(playerOne.user.id).emit('gameFinished', 'empate');
        if (playerTwo.user.id != 'bot')
            userIdWithSocketInstance.get(playerTwo.user.id).emit('gameFinished', 'empate');
    }
    if (playerOne.score > playerTwo.score) {
        userIdWithSocketInstance.get(playerOne.user.id).emit('gameFinished', 'ganaste');
        if (playerTwo.user.id != 'bot')
            userIdWithSocketInstance.get(playerTwo.user.id).emit('gameFinished', 'perdiste');
    }
    if (playerTwo.score > playerOne.score) {
        if (playerTwo.user.id != 'bot')
            userIdWithSocketInstance.get(playerTwo.user.id).emit('gameFinished', 'ganaste');
        userIdWithSocketInstance.get(playerOne.user.id).emit('gameFinished', 'perdiste');
    }
    if (playerTwo.user.id == 'bot') {
        let user = IdWithUser.get(playerOne.user.id);
        user.inGame = false;
        IdWithUser.set(user.id, user);
    } else {
        let user = IdWithUser.get(playerTwo.user.id);
        user.inGame = false;
        IdWithUser.set(user.id, user);
        user = IdWithUser.get(playerOne.user.id);
        user.inGame = false;
        IdWithUser.set(user.id, user);
    }
    enviarUsuariosConectados();
}

function enviarUsuariosConectados() {
    let users = [];
    IdWithUser.forEach((user) => {
        console.log('recopilando onlines - ', user);
        if (!user.inGame)
            users.push(user);
    })
    io.emit('listOfUsersOnline', users);
}

function validarMovimientos(playerOne, playerTwo) {
    if (playerOne.selectedMove == playerTwo.selectedMove) return 'Empate';
    if (playerOne.selectedMove == 'Piedra' && playerTwo.selectedMove == 'Tijera') return playerOne.user.name;
    if (playerTwo.selectedMove == 'Piedra' && playerOne.selectedMove == 'Tijera') return playerTwo.user.name;
    if (playerOne.selectedMove == 'Papel' && playerTwo.selectedMove == 'Tijera') return playerTwo.user.name;
    if (playerTwo.selectedMove == 'Papel' && playerOne.selectedMove == 'Tijera') return playerOne.user.name;
    if (playerOne.selectedMove == 'Papel' && playerTwo.selectedMove == 'Piedra') return playerOne.user.name;
    if (playerTwo.selectedMove == 'Papel' && playerOne.selectedMove == 'Piedra') return playerTwo.user.name;
}


module.exports = server;