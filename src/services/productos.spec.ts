import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { isProductType, PRODUCT_TYPES } from '../models/product';
import { CatalogoService } from './productos';

describe('CatalogoService', () => {
  let service: CatalogoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CatalogoService,
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(CatalogoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('accepts every product type supported by the catalog', () => {
    for (const type of PRODUCT_TYPES) {
      expect(isProductType(type)).toBe(true);
    }
  });

  it('rejects product types that are not supported by the catalog', () => {
    expect(isProductType('nicho')).toBe(false);
    expect(isProductType('unknown')).toBe(false);
    expect(isProductType(null)).toBe(false);
  });
});
