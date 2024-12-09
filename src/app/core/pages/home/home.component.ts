import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [
    trigger('scaleFadeIn', [
      state('void', style({
        transform: 'scale(0.5)', opacity: 0
      })),
      transition(':enter', [
        animate('400ms ease-in-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class HomeComponent {

}
