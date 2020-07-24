import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon'
import {MatAutocompleteModule} from '@angular/material/autocomplete'
import {MatListModule} from '@angular/material/list';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatTableModule} from '@angular/material/table';
import {MatSliderModule} from '@angular/material/slider';

import { SocketioService } from './socketio.service';

import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ModalComponent } from './components/modal/modal.component';
import { LoginComponent } from './components/login/login.component';
import { PlayComponent } from './components/play/play.component';
import { TablaComponent } from './components/tabla/tabla.component';
import { PlayFooterComponent } from './components/play-footer/play-footer.component';
import { NotificacionToPlayComponent } from './components/notificacion-to-play/notificacion-to-play.component';

@NgModule({
  declarations: [
    AppComponent,
    ModalComponent,
    LoginComponent,
    PlayComponent,
    TablaComponent,
    PlayFooterComponent,
    NotificacionToPlayComponent,
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatListModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTableModule,
    MatSliderModule
  ],
  providers: [SocketioService],
  bootstrap: [AppComponent]
})
export class AppModule { }
