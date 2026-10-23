import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchBar } from '../search-bar/search-bar';
import { ProductType } from '../../models/product';

@Component({
  imports: [SearchBar, RouterLink],
  selector: 'app-navbar',
  styleUrl: './navbar.scss',
  templateUrl: './navbar.html',
})
export class Navbar {
  @Output() searchChange = new EventEmitter<string>();
  @Output() typeChange = new EventEmitter<ProductType>();

  @Input() pageTitle: string = "Privee Fragances Catalog";
  @Input() selectedType: ProductType | null = null;
  @Input() menuItems: Array<{label: string, type: ProductType}> = [
    {label: "Árabes", type: "arabe"},
    {label: "Diseñador", type: "diseñador"},
    {label: "Nicho", type: "nicho"}
  ];
}
