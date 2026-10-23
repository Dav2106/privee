import { ChangeDetectorRef, Component, Inject, Input, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Card } from '../../common/card/card';
import { CatalogoService } from '../../services/productos';
import ProductDTO, { ProductType } from '../../models/product';

type SortMode = 'best-selling' | 'newest';
type PriceSort = 'default' | 'price-asc' | 'price-desc';

@Component({
  imports: [Card],
  selector: 'app-product',
  styleUrl: './product.scss',
  templateUrl: './product.html',
})
export class Product {
  private readonly changeDetector = inject(ChangeDetectorRef);

  products: Array<ProductDTO> = [];
  loading = true;
  loadError = false;
  invalidDocumentCount = 0;
  @Input() searchTerm = '';
  @Input() productType: ProductType | null = null;
  selectedBrands = new Set<string>();
  showAllBrands = false;
  sortMode: SortMode = 'best-selling';
  priceSort: PriceSort = 'default';

  get brands(): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();

    for (const product of this.products) {
      counts.set(product.company, (counts.get(product.company) ?? 0) + 1);
    }

    return Array.from(counts, ([name, count]) => ({ name, count })).sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }

  get visibleBrands(): Array<{ name: string; count: number }> {
    return this.showAllBrands ? this.brands : this.brands.slice(0, 12);
  }

  get filteredProducts(): Array<ProductDTO> {
    const query = this.normalize(this.searchTerm.trim());

    const filtered = this.products.filter((product) => {
      const matchesSearch =
        !query ||
        [product.name, product.company, product.description, String(product.price)].some((value) =>
          this.normalize(value).includes(query),
        );
      const matchesBrand =
        this.selectedBrands.size === 0 || this.selectedBrands.has(product.company);
      const matchesType = this.productType === null || product.type === this.productType;

      return matchesSearch && matchesBrand && matchesType;
    });

    if (this.priceSort === 'price-asc') {
      return filtered.sort((first, second) => first.price - second.price);
    }

    if (this.priceSort === 'price-desc') {
      return filtered.sort((first, second) => second.price - first.price);
    }

    return this.sortMode === 'newest'
      ? filtered.sort((first, second) => second.id - first.id)
      : filtered;
  }

  constructor(catalogo: CatalogoService, @Inject(PLATFORM_ID) platformId: object) {
    if (isPlatformBrowser(platformId)) {
      catalogo
        .obtenerProductos()
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (result) => {
            this.products = result.products;
            this.invalidDocumentCount = result.invalidDocuments.length;
            if (this.invalidDocumentCount > 0) {
              console.warn(
                'Se omitieron documentos inválidos de la colección de Firestore "privee".',
                result.invalidDocuments,
              );
            }
            this.loading = false;
            this.loadError = false;
            this.changeDetector.markForCheck();
          },
          error: (error: unknown) => {
            console.error('No se pudieron cargar los productos de Firestore.', error);
            this.loading = false;
            this.loadError = true;
            this.changeDetector.markForCheck();
          },
        });
    }
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();
  }

  isBrandSelected(brand: string): boolean {
    return this.selectedBrands.has(brand);
  }

  toggleBrand(brand: string, event: Event): void {
    const checkbox = event.target;

    if (!(checkbox instanceof HTMLInputElement)) {
      return;
    }

    if (checkbox.checked) {
      this.selectedBrands.add(brand);
    } else {
      this.selectedBrands.delete(brand);
    }
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
    this.priceSort = 'default';
  }

  onPriceSortChange(event: Event): void {
    const select = event.target;

    if (select instanceof HTMLSelectElement) {
      const value = select.value;

      if (value === 'default' || value === 'price-asc' || value === 'price-desc') {
        this.priceSort = value;
      }
    }
  }
}
