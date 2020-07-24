import { Component, OnInit, Input } from '@angular/core';
import { SocketioService } from 'src/app/socketio.service';

@Component({
  selector: 'app-play-footer',
  templateUrl: './play-footer.component.html',
})
export class PlayFooterComponent implements OnInit {

  @Input() socket:SocketioService
  
  opcionElegida:boolean = false;

  constructor() { }

  ngOnInit(): void {
    
  }

  selectChange(){
    this.opcionElegida = true;
  }

}
