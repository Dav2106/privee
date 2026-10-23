import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FirebaseError } from 'firebase/app';
import { ADMIN_EMAIL } from '../../config/admin-access';
import {
  CatalogProduct,
  CatalogoService,
  InvalidCatalogDocument,
  NewCatalogProduct,
} from '../../services/productos';
import { ProductType } from '../../models/product';

interface ProductForm {
  name: string;
  company: string;
  imageSrc: string;
  description: string;
  price: number | null;
  type: ProductType;
}

function emptyProductForm(): ProductForm {
  return {
    name: '',
    company: '',
    imageSrc: '',
    description: '',
    price: null,
    type: 'arabe',
  };
}

@Component({
  imports: [FormsModule],
  selector: 'app-admin-maintenance',
  styleUrl: './admin-maintenance.scss',
  templateUrl: './admin-maintenance.html',
})
export class AdminMaintenance {
  products: CatalogProduct[] = [];
  invalidDocuments: InvalidCatalogDocument[] = [];
  draft = emptyProductForm();
  editingProduct: CatalogProduct | null = null;
  loading = true;
  saving = false;
  savePendingWarning = false;
  errorMessage = '';
  successMessage = '';

  private readonly catalog = inject(CatalogoService);
  private readonly auth = inject(Auth);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  constructor() {
    this.catalog
      .obtenerProductos()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (result) => {
          this.products = [...result.products].sort((first, second) =>
            first.name.localeCompare(second.name),
          );
          this.invalidDocuments = result.invalidDocuments;
          this.loading = false;
          this.errorMessage = '';
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          console.error('No se pudieron cargar productos en mantenimiento.', error);
          this.loading = false;
          this.errorMessage =
            'No se pudieron cargar los productos. Revisa tu acceso a Firestore e intenta recargar.';
          this.changeDetector.markForCheck();
        },
      });
  }

  beginCreate(): void {
    this.editingProduct = null;
    this.draft = emptyProductForm();
    this.errorMessage = '';
    this.successMessage = '';
  }

  beginEdit(product: CatalogProduct): void {
    this.editingProduct = product;
    this.draft = {
      name: product.name,
      company: product.company,
      imageSrc: product.imageSrc,
      description: product.description,
      price: product.price,
      type: product.type,
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit(): void {
    this.beginCreate();
  }

  async saveProduct(): Promise<void> {
    if (this.saving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.savePendingWarning = false;

    if (
      this.draft.price === null ||
      !Number.isFinite(this.draft.price) ||
      this.draft.price < 0 ||
      this.draft.price > 999999999
    ) {
      this.errorMessage = 'Ingresa un precio válido entre ₡0 y ₡999.999.999.';
      return;
    }

    const product: NewCatalogProduct = {
      name: this.draft.name.trim(),
      company: this.draft.company.trim(),
      imageSrc: this.draft.imageSrc.trim(),
      description: this.draft.description.trim(),
      price: this.draft.price,
      type: this.draft.type,
    };

    if (!product.name || !product.company || !product.imageSrc || !product.description) {
      this.errorMessage = 'Completa todos los campos antes de guardar.';
      return;
    }
    if (!/^https?:\/\/.+$/.test(product.imageSrc)) {
      this.errorMessage = 'La URL de imagen debe comenzar con http:// o https://.';
      return;
    }

    this.saving = true;
    const wasEditing = this.editingProduct !== null;
    const pendingWarningTimer = window.setTimeout(() => {
      this.savePendingWarning = true;
    }, 12000);

    try {
      if (this.editingProduct !== null) {
        await this.catalog.actualizarProducto(this.editingProduct.documentId, {
          ...product,
          id: this.editingProduct.id,
        });
        this.successMessage = 'Producto actualizado.';
      } else {
        await this.catalog.crearProducto(product);
        this.successMessage = 'Producto agregado al catálogo.';
      }

      this.beginCreate();
      this.successMessage = wasEditing ? 'Producto actualizado.' : 'Producto agregado al catálogo.';
    } catch (error) {
      console.error('No se pudo guardar el producto.', error);
      this.errorMessage = this.getWriteErrorMessage(error, 'guardar');
    } finally {
      window.clearTimeout(pendingWarningTimer);
      this.savePendingWarning = false;
      this.saving = false;
    }
  }

  async deleteProduct(product: CatalogProduct): Promise<void> {
    if (
      !window.confirm(`¿Eliminar "${product.name}" del catálogo? Esta acción no se puede deshacer.`)
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.catalog.eliminarProducto(product.documentId);
      if (this.editingProduct?.documentId === product.documentId) {
        this.beginCreate();
      }
      this.successMessage = `"${product.name}" fue eliminado.`;
    } catch (error) {
      console.error('No se pudo eliminar el producto.', error);
      this.errorMessage = this.getWriteErrorMessage(error, 'eliminar');
    }
  }

  async deleteInvalidDocument(document: InvalidCatalogDocument): Promise<void> {
    if (
      !window.confirm(
        `¿Eliminar el documento inválido "${document.documentId}" de Firestore? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.catalog.eliminarProducto(document.documentId);
      this.successMessage = `Se eliminó el documento inválido "${document.documentId}".`;
    } catch (error) {
      console.error('No se pudo eliminar el documento inválido.', error);
      this.errorMessage = this.getWriteErrorMessage(error, 'eliminar');
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      await this.router.navigateByUrl('/admin/login');
    } catch (error) {
      console.error('No se pudo cerrar la sesión administrativa.', error);
      this.errorMessage = 'No se pudo cerrar la sesión. Intenta de nuevo.';
    }
  }

  private getWriteErrorMessage(error: unknown, operation: string): string {
    if (!(error instanceof FirebaseError)) {
      return `No se pudo ${operation} el producto. Revisa tu conexión e intenta de nuevo.`;
    }

    switch (error.code) {
      case 'permission-denied':
        return `Firestore rechazó la operación. Confirma que las reglas estén desplegadas y que hayas iniciado sesión con ${ADMIN_EMAIL}.`;
      case 'unauthenticated':
        return 'Tu sesión expiró. Cierra sesión e inicia sesión de nuevo.';
      case 'unavailable':
      case 'deadline-exceeded':
        return 'Firestore no está disponible. Revisa tu conexión e intenta de nuevo.';
      default:
        return `No se pudo ${operation} el producto en Firestore (${error.code}).`;
    }
  }
}
