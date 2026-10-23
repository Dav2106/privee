import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import ProductDTO from '../models/product';

type FirestoreProduct = Record<string, unknown>;
const PRODUCTS_COLLECTION = 'privee';

export interface CatalogProduct extends ProductDTO {
  documentId: string;
}

export interface InvalidCatalogDocument {
  documentId: string;
  invalidFields: string[];
}

export interface CatalogProductsResult {
  products: CatalogProduct[];
  invalidDocuments: InvalidCatalogDocument[];
}

interface ValidFirestoreProduct extends FirestoreProduct {
  documentId: string;
  id: number;
  name: string;
  company: string;
  imageSrc: string;
  description: string;
  price: number;
  type: ProductDTO['type'];
}

export type NewCatalogProduct = Omit<ProductDTO, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class CatalogoService {
  private readonly firestore = inject(Firestore);

  obtenerProductos(): Observable<CatalogProductsResult> {
    const productsRef = collection(this.firestore, PRODUCTS_COLLECTION);

    return collectionData<FirestoreProduct>(productsRef, { idField: 'documentId' }).pipe(
      map((documents) => {
        const products: CatalogProduct[] = [];
        const invalidDocuments: InvalidCatalogDocument[] = [];

        for (const document of documents) {
          if (this.isValidProductDocument(document)) {
            products.push(this.parseProduct(document));
          } else {
            invalidDocuments.push({
              documentId:
                typeof document['documentId'] === 'string' ? document['documentId'] : 'desconocido',
              invalidFields: this.getInvalidFields(document),
            });
          }
        }

        return { products, invalidDocuments };
      }),
    );
  }

  async crearProducto(product: NewCatalogProduct): Promise<void> {
    const productsRef = collection(this.firestore, PRODUCTS_COLLECTION);
    await addDoc(productsRef, { ...product, id: Date.now() });
  }

  async actualizarProducto(documentId: string, product: ProductDTO): Promise<void> {
    await updateDoc(doc(this.firestore, PRODUCTS_COLLECTION, documentId), { ...product });
  }

  async eliminarProducto(documentId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, PRODUCTS_COLLECTION, documentId));
  }

  private getInvalidFields(document: FirestoreProduct): string[] {
    const invalidFields: string[] = [];
    const { documentId, id, name, company, imageSrc, description, price, type, ...extraFields } =
      document;

    if (typeof documentId !== 'string') invalidFields.push('documentId (id de documento ausente)');
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 0) {
      invalidFields.push('id (debe ser un entero positivo)');
    }
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > 120)
      invalidFields.push('name');
    if (typeof company !== 'string' || company.trim().length < 1 || company.length > 100)
      invalidFields.push('company');
    if (
      typeof imageSrc !== 'string' ||
      imageSrc.length > 2048 ||
      !/^https?:\/\/.+$/.test(imageSrc)
    ) {
      invalidFields.push('imageSrc (debe ser una URL HTTP o HTTPS)');
    }
    if (
      typeof description !== 'string' ||
      description.trim().length < 1 ||
      description.length > 500
    ) {
      invalidFields.push('description');
    }
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 999999999) {
      invalidFields.push('price (debe ser un número entre 0 y 999999999)');
    }
    if (type !== 'arabe' && type !== 'diseñador' && type !== 'nicho') invalidFields.push('type');
    if (Object.keys(extraFields).length > 0)
      invalidFields.push(`campos adicionales: ${Object.keys(extraFields).join(', ')}`);

    return invalidFields;
  }

  private parseProduct(document: ValidFirestoreProduct): CatalogProduct {
    const { documentId, id, name, company, imageSrc, description, price, type } = document;

    return {
      documentId,
      id,
      name,
      company,
      imageSrc,
      description,
      price,
      type,
    };
  }

  private isValidProductDocument(document: FirestoreProduct): document is ValidFirestoreProduct {
    return this.getInvalidFields(document).length === 0;
  }
}
