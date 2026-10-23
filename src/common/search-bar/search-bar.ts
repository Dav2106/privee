import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-search-bar',
  styleUrl: './search-bar.scss',
  templateUrl: './search-bar.html',
})
export class SearchBar {
  @Output() searchChange = new EventEmitter<string>();

  onSearch(event: Event): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      this.searchChange.emit(input.value);
    }
  }
}
