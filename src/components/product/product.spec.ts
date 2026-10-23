import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Product } from './product';
import { CatalogoService } from '../../services/productos';
import ProductDTO from '../../models/product';

const testProducts: ProductDTO[] = [
  {
    id: 1,
    name: 'ASAD',
    company: 'Lattafa',
    imageSrc: '',
    description: 'Inspired of Sauvage Dior Elixir',
    price: 20000,
    type: 'arabe',
  },
  {
    id: 2,
    name: 'ANGHAM',
    company: 'Lattafa',
    imageSrc: '',
    description: 'Inspired of Burberry Goddess',
    price: 20000,
    type: 'arabe',
  },
  {
    id: 3,
    name: 'CDN Intense',
    company: 'Armaf',
    imageSrc: '',
    description: 'Inspired of Creed Aventus',
    price: 22000,
    type: 'arabe',
  },
  {
    id: 4,
    name: 'CDN Woman',
    company: 'Armaf',
    imageSrc: '',
    description: 'Inspired of Coco Mademoiselle',
    price: 24000,
    type: 'arabe',
  },
  {
    id: 5,
    name: 'Hawas Ice',
    company: 'Rasasi',
    imageSrc: '',
    description: 'Inspired of Invictus Aqua',
    price: 28000,
    type: 'arabe',
  },
  {
    id: 6,
    name: 'Hawas Diva',
    company: 'Rasasi',
    imageSrc: '',
    description: 'Inspired of Valentino DBIR Intense',
    price: 28000,
    type: 'arabe',
  },
  {
    id: 7,
    name: '9 PM',
    company: 'Afnan',
    imageSrc: '',
    description: 'Inspired of JPG Ultramale',
    price: 22000,
    type: 'arabe',
  },
  {
    id: 8,
    name: '9 AM',
    company: 'Afnan',
    imageSrc: '',
    description: 'Inspired of My Way Armani',
    price: 22000,
    type: 'arabe',
  },
];

describe('Product', () => {
  let component: Product;
  let fixture: ComponentFixture<Product>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Product],
      providers: [
        {
          provide: CatalogoService,
          useValue: {
            obtenerProductos: () => of({ products: testProducts, invalidDocuments: [] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Product);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter products by name, company, description, and price', () => {
    component.searchTerm = 'lattafa';
    expect(component.filteredProducts.map((product) => product.name)).toEqual(['ASAD', 'ANGHAM']);

    component.searchTerm = 'Dior Elixir';
    expect(component.filteredProducts.map((product) => product.name)).toEqual(['ASAD']);

    component.searchTerm = '24000';
    expect(component.filteredProducts.map((product) => product.name)).toEqual(['CDN Woman']);
  });

  it('should show all products when the search term is empty or unmatched', () => {
    const productCount = component.products.length;
    component.searchTerm = '   ';
    expect(component.filteredProducts).toHaveLength(productCount);

    component.searchTerm = 'no existe';
    expect(component.filteredProducts).toHaveLength(0);
  });

  it('should expose brand counts and filter by selected brand', () => {
    expect(component.brands).toContainEqual({ name: 'Armaf', count: 2 });

    component.selectedBrands.add('Armaf');
    expect(component.filteredProducts.map((product) => product.company)).toEqual([
      'Armaf',
      'Armaf',
    ]);
  });

  it('should sort by newest and by price when requested', () => {
    component.setSortMode('newest');
    expect(component.filteredProducts[0].id).toBe(8);

    component.priceSort = 'price-asc';
    expect(component.filteredProducts[0].price).toBe(20000);

    component.priceSort = 'price-desc';
    expect(component.filteredProducts[0].price).toBe(28000);
  });

  it('should filter products by type while preserving other active filters', () => {
    component.productType = 'arabe';
    expect(component.filteredProducts).toHaveLength(8);

    component.productType = 'diseñador';
    expect(component.filteredProducts).toHaveLength(0);

    component.productType = null;
    component.searchTerm = 'asad';
    expect(component.filteredProducts.map((product) => product.name)).toEqual(['ASAD']);
  });
});
