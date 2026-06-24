import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-state-message',
  standalone: true,
  imports: [NgIf],
  templateUrl: './state-message.component.html',
  styleUrl: './state-message.component.scss',
})
export class StateMessageComponent {
  @Input({ required: true }) type!: 'error' | 'empty';
  @Input({ required: true }) message!: string;
  @Input() showRetry = false;
  @Output() retry = new EventEmitter<void>();
}
