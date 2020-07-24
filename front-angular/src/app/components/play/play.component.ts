import { Component, OnInit, Input } from '@angular/core';
import { SocketioService } from 'src/app/socketio.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
})
export class PlayComponent implements OnInit {

  @Input() socketService:SocketioService;

  formatLabel(value: number) {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return value;
  }
  constructor( ) { }

  ngOnInit(): void {

  }

}
