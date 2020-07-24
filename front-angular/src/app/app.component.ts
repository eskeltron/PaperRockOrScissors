import { Component, OnInit } from '@angular/core';
import { SocketioService } from './socketio.service';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// @SocketioService({})
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
  })
export class AppComponent  implements OnInit, MatSelectModule{

  title = 'socketio-angular';
  
  constructor(
    public socketService: SocketioService
  ) {}

  ngOnInit() {
    this.socketService.setupSocketConnection();
  }


}