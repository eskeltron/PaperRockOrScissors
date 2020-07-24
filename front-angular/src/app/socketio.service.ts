import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from "rxjs";
import * as io from 'socket.io-client';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalComponent } from './components/modal/modal.component';
import { RequiredValidator } from '@angular/forms';
import { Directionality } from '@angular/cdk/bidi';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  socket:any;

  actualUser:User = {
    inGame:false,
    id: null,
    name: null
  };
  adversary:User = {
    inGame:false,
    id: null,
    name: null
  };
  requesterToPlay: User = {
    inGame:false,
    id: null,
    name: null
  };
  game:Game = {
    id:null,
    maxMoves:0,
    numberActualOfMove:0,
    playerOne:null,
    playerTwo:null,
    scores: []
  }

  maxScore:number = 1;
  //Usuario
  nameSelected:boolean = false;
  moveSelected:boolean = false;
  //Enemigo
  adversarySelected:boolean = false;
  adversarySelectMove:boolean = false;
 //Juego
  gameStarted:boolean   = false
  requestToPlay:boolean = false;
  requestToPlaySender:boolean = false;

  //15 segundos para jugar
  startTimer:boolean = false;
  timer:number = 0;
  intervalo:any = null;  

  //Jugando contra un bot
  playingAgainstBot:boolean = false;

  private actualName = new BehaviorSubject<string>("");
  public actualName$ = this.actualName.asObservable();

  protected listOfUsers = new BehaviorSubject<User[]>([]);
  public listOfUsers$ = this.listOfUsers.asObservable();


  constructor(private _snackBar:MatSnackBar) { }

  setupSocketConnection():void {
    // this.socket = io(environment.SOCKET_ENDPOINT);
    // this.socket = io(`http://localhost:4000`);
    this.socket = io();

    // Actualiza la lista de usuarios conectados
    this.socket.on('listOfUsersOnline', (actualUssers:User[]) => {
      this.listOfUsers.next( actualUssers.filter( (user) => user.id != this.actualUser.id) );
    });
    
    // El usuario obtiene su id
    this.socket.on('id', (id:string) => {
      this.actualUser.id = id;
    })

    // Recibe una petición para jugar
    // posicion 0 user
    // posicion 1 maximos movimientos
    this.socket.on('requestToPlay', ( params:any[] ) => {
      //Cuando se lanza una petición para jugar, esta es replicada por el servidor
      //Tanto al usuario que se le envió la petición como al que la envió
      //Esto para que los 2 comiencen el timer a la vez.
      if(this.requestToPlaySender){
        this.empezarTimer();
        return;
      }
      let user = params[0];
      this.game.maxMoves = params[1];
      this.requesterToPlay = user;
      this.requestToPlay   = true;
      this.empezarTimer();
    });

    // Aceptaron su juego y comienzan a jugar.
    this.socket.on('gameStart', ( game:Game ) => {
      this.pararTimer();
      this.game = game;
      this.requestToPlaySender = false;
      this.requestToPlay = false;
      this.adversary = (game.playerOne.user.id == this.requesterToPlay.id) ? game.playerOne.user : this.requesterToPlay;
      this.requesterToPlay = {id:null,inGame:false,name:null};
      this.gameStarted  = true;
      this.empezarTimer();
    });

    // El enemigo realizo su juego.
    this.socket.on('result',(game:Game) => {
      if( !this.moveSelected ){
        this.adversarySelectMove = true;
      }
      if(game.scores.length > this.game.scores.length){
        this.pararTimer();
        this.moveSelected = false;
        this.adversarySelectMove = false;
        this.empezarTimer();
      }
      console.log('recibo - ',game);
      this.game = game;
    })
    // Juego finalizado
    this.socket.on('gameFinished',(razon:string) => {
      this.pararTimer();
      console.log('razon:', razon);
      switch(razon){
        case 'desconectado':
          this.openSnackBar('El adversario se desconectó el juego.');
          break;
        case 'juego finalizado':
          this.openSnackBar('El juego finalizó.');
          break;
        case 'abandonaste':
          this.openSnackBar('Abandonaste el juego.')
          break;
        case 'adversario abandono':
          this.openSnackBar('El adversario abandono el juego.')
          break;
        case 'ganaste':
            this.openSnackBar('¡Hurra! Ganaste el juego.')
          break;
        case 'perdiste':
            this.openSnackBar('Perdiste, la próxima te ira mejor.')
          break;
        case 'empate':
            this.openSnackBar('Empate.')
          break;
        default:
          this.openSnackBar('Tiempo de espera agotado...');
          break;
      }
      this.setAllFalse();
    })

    this.socket.on('gameWontStart',(name:string) => {
      this.pararTimer();
      console.log('nombre recibido:',name,'mi nombre:',this.actualUser.name);
      if(name == this.actualUser.name){
        this.openSnackBar(`${this.requesterToPlay.name} cancelo la invitación para jugar.`);
        this.requestToPlay = false;
        this.requestToPlaySender = false;
        this.requesterToPlay = {id:null,name:null,inGame:false};
      }else{
        this.openSnackBar(`Cancelaste la espera.`);
        this.requestToPlaySender = false;
        this.requestToPlay = false;
        this.requesterToPlay = {id:null,name:null,inGame:false};
      }
      // this.setAllFalse();
    })

    this.socket.on('cancelRequestToStartPlay',() => {
      this.pararTimer();
      if(this.requestToPlaySender){
        this.openSnackBar('Cancelaste el juego.');
        this.adversary = {id:null, name:null,inGame:false};
        this.requestToPlaySender = false;
      }else{
        this.openSnackBar(`${this.requesterToPlay.name} cancelo el juego.`);
        this.requestToPlay = false;
        this.requesterToPlay = {id:null,name:null,inGame:false};
      }
    });
  }
  setMaxScore(value:number){
    this.maxScore = value;
  }
  empezarTimer():void{
    console.log('Se ejecuto la función empezar timer.');
    this.intervalo = setInterval(() => {
      if(this.timer === 0 && !this.startTimer )
      this.startTimer = true;
      this.timer+=100;
      if(this.timer == 15000){
        console.log('Se ejecuto el fin del timer.');
        this.startTimer = false;
        clearInterval(this.intervalo);
        this.intervalo = null;
        this.timer = 0;
      }
    },100);
  }

  pararTimer():void{
    console.log('se paro el timer');
    this.timer = 0;
    this.startTimer = false;
    clearInterval(this.intervalo);
    this.intervalo = null;
  }

  //terminar el juego desde "Abandonar"
  finishGame():void{
    this.socket.emit('finishGame',this.game);
  }

  openSnackBar(message:string):void {
    this._snackBar.open(message, 'Cerrar' ,{
      duration: 5000,
      verticalPosition:"top"
    });
  }
  
  setAllFalse():void{
    this.moveSelected        = false;
    this.adversarySelected   = false;
    this.adversarySelectMove = false;
    this.gameStarted         = false
    this.requestToPlay       = false;
    this.requestToPlaySender = false;
    this.startTimer          = false;
    this.playingAgainstBot   = false;
    this.adversary           = {id:null,name:null,inGame:false};
    this.requesterToPlay     = {id:null,name:null,inGame:false};
  }

  selectName(name:string):void{
      this.nameSelected = true;
      this.actualUser.name = name;
      this.socket.emit('userReady', this.actualUser);
  }

  verifyName(name:string):boolean{
      if(this.listOfUsers.getValue().length == 0){
        this.socket.emit('requestUsersOn');
      }
      let nameRepeat = this.listOfUsers.getValue().some( (user:User) =>{
        return user.name == name;
      });
      if( !nameRepeat ){
        this.selectName(name);
      }
      return nameRepeat;
  }

  selectAdversary(user:User):void{
    if(user != null){
      this.requesterToPlay = user;
      this.requestToPlaySender = true;
      this.socket.emit('wantToPlay', [user, this.maxScore]);
    }
  }
  
  acceptGame():void{
    this.adversary = this.requesterToPlay;
    this.socket.emit('gameAccepted', this.requesterToPlay);
  }

  declineGame():void{
    console.log('cancelaste el juego a:',this.requesterToPlay);
    this.socket.emit('gameDeclined', this.requesterToPlay);
  }

  sendMove( move:string){
    this.moveSelected = true;
    if(this.playingAgainstBot){
      this.game.playerOne.selectedMove = move;
      this.game.playerTwo.selectedMove = this.movimientoAleatorio();
    }else{
      if( this.game.playerOne.user.name == this.actualUser.name){
        this.game.playerOne.selectedMove = move;
      }else{
        this.game.playerTwo.selectedMove = move;
      }
    }
    console.log('envio - ',this.game);
    this.socket.emit('Move', this.game);
  }

  movimientoAleatorio():string{
    let movimientos:string[] = ['Piedra','Papel','Tijera'];
    let elegido:string = movimientos[Math.floor(Math.random() * movimientos.length)];
    return elegido;
  }

  jugarContraBot(){
    this.playingAgainstBot = true;
    this.requestToPlaySender = true;
    let bot:User = {
      id: 'bot',
      inGame: true,
      name: 'bot'
    };
    let playerOne:Player = {
      user: this.actualUser,
      selectedMove: null,
      score: 0
  };
  let playerTwo:Player = {
      user: bot,
      selectedMove: null,
      score: 0
  };
  let maxMoves = Math.floor(this.maxScore / 2) + 1;
  let id = `${this.actualUser.id} ${bot.id}`;
  let game:Game = {
    id,
    playerOne,
    playerTwo,
    maxMoves,
    numberActualOfMove:0,
    scores: []
  }
    this.requesterToPlay = bot;
    this.socket.emit('gameAgainstBot', game);
  }

}

interface User{
  inGame:boolean,
  name:string,
  id:string
}
interface Game {
  id:string,
  playerOne:Player,
  playerTwo:Player,
  maxMoves:number,
  numberActualOfMove:number,
  scores:Score[]
}
interface Player{
  user:User,
  selectedMove:string,
  score:number
}
interface Score{
  playerOneMove:string,
  playerTwoMove:string,
  winner:string
}
