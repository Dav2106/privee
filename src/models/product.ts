export type ProductType = 'arabe' | 'diseñador' | 'nicho';

export default interface ProductDTO{
    id: number;
    name: string;
    company: string;
    imageSrc: string;
    description: string;
    price: number;
    type: ProductType;
}