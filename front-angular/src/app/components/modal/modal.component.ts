import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
})
export class ModalComponent implements OnInit {

  @Input() mensaje:string;

  constructor() { }

  ngOnInit(): void {
    
  }

}
