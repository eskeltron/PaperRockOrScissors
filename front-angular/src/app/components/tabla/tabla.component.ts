import { Component, OnInit, Input } from '@angular/core';
import { SocketioService } from 'src/app/socketio.service';

@Component({
  selector: 'app-tabla',
  templateUrl: './tabla.component.html',
})
export class TablaComponent implements OnInit {

  @Input() socketService:SocketioService;

  constructor() { }

  ngOnInit(): void { }

}
