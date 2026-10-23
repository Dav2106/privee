import { Component } from '@angular/core';
import { Navbar } from '../../common/navbar/navbar';
import { Product } from '../../components/product/product';
import { ProductType } from '../../models/product';

@Component({
  imports: [Navbar, Product],
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.html',
})
export class CatalogPage {
  searchTerm = '';
  selectedProductType: ProductType | null = null;

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
  }

  onTypeChange(type: ProductType): void {
    this.selectedProductType = type;
  }
}
