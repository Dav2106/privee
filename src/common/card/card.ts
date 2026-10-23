import { Component, Input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-card',
  styleUrl: './card.scss',
  templateUrl: './card.html',
})
export class Card {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() imageSrc = '';
  @Input() description = '';
  @Input() price: number | string = '';
  constructor(){
  }
}
