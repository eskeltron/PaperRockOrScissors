import { Component, OnInit, Input} from '@angular/core';
import { SocketioService } from 'src/app/socketio.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent  implements OnInit{

  incorrectName:boolean = false;
  showErrorMessage:boolean = false;
    
  @Input() socketService:SocketioService;
  
  name:string;

  constructor() {
  }

  ngOnInit(): void {}

  verifiyName(name:string){
    this.name = name;
    if(name.length < 3){
      this.incorrectName = true;
      setTimeout( () => {
        this.incorrectName = false;
      }, 2000);
    }else{
      if( !this.socketService.nameSelected ){
        this.showErrorMessage = this.socketService.verifyName(name);
        if( this.showErrorMessage ){
          setTimeout( () =>{
            this.showErrorMessage = false;
          }, 2000)
        }
      }
    }

  }
}