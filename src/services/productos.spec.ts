import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
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
});
