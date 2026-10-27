export const PRODUCT_TYPES = ['arabe', 'diseñador', 'splash', 'niños', 'cremas'] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export function isProductType(value: unknown): value is ProductType {
  return PRODUCT_TYPES.some((type) => type === value);
}

export default interface ProductDTO {
  id: number;
  name: string;
  company: string;
  imageSrc: string;
  description: string;
  price: number;
  type: ProductType;
}