import { MenuCategory } from '../types';

export class MenuItemModel {
  public id: string;
  public name: string;
  public category: MenuCategory;
  public description: string;
  public price: number;
  public imageUrl: string;
  public images: string[];
  public tag?: string;
  public isAvailable: boolean;
  public createdAt: string;

  constructor(data: {
    id: string;
    name: string;
    category: MenuCategory;
    description: string;
    price: number;
    image_url?: string;
    imageUrl?: string;
    images?: string[];
    tag?: string;
    is_available?: boolean;
    isAvailable?: boolean;
    created_at?: string;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.description = data.description;
    this.price = data.price;
    this.imageUrl = data.imageUrl || data.image_url || '/src/assets/images/nasi_box_ayambakar_1792341600484.jpg';
    this.images = Array.isArray(data.images) && data.images.length > 0 
      ? data.images 
      : [this.imageUrl];
    this.tag = data.tag;
    this.isAvailable = data.isAvailable ?? data.is_available ?? true;
    this.createdAt = data.created_at || new Date().toISOString();
  }

  get formattedPrice(): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(this.price);
  }

  get isTumpengBig(): boolean {
    return this.category === 'tumpeng' && this.price > 100000;
  }

  get priceUnitLabel(): string {
    return this.isTumpengBig ? '/tampah' : '/pax';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      description: this.description,
      price: this.price,
      image_url: this.imageUrl,
      images: this.images,
      tag: this.tag,
      is_available: this.isAvailable,
      created_at: this.createdAt
    };
  }
}
