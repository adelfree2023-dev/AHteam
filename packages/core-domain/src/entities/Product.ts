import { Entity } from '../base/Entity';
import { TenantId } from '../value-objects/TenantId';
import { Money } from '../value-objects/Money';

export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    DISCONTINUED = 'DISCONTINUED',
}

export interface ProductVariant {
    id: string;
    sku: string;
    name: string;
    price: Money;
    stock: number;
    attributes: Record<string, string>;
}

export interface ProductProps {
    id: string;
    tenantId: TenantId;
    storeId: string;
    name: string;
    slug: string;
    description?: string;
    price: Money;
    status: ProductStatus;
    categoryIds: string[];
    variants: ProductVariant[];
    images: string[];
    metadata?: Record<string, unknown>;
}

/**
 * Product Entity
 * 
 * Represents a product in a store.
 * Supports variants, categories, and inventory tracking.
 */
export class Product extends Entity<string> {
    private readonly _tenantId: TenantId;
    private readonly _storeId: string;
    private _name: string;
    private _slug: string;
    private _description: string;
    private _price: Money;
    private _status: ProductStatus;
    private _categoryIds: string[];
    private _variants: ProductVariant[];
    private _images: string[];
    private _metadata: Record<string, unknown>;

    private constructor(props: ProductProps) {
        super(props.id);
        this._tenantId = props.tenantId;
        this._storeId = props.storeId;
        this._name = props.name;
        this._slug = props.slug;
        this._description = props.description ?? '';
        this._price = props.price;
        this._status = props.status;
        this._categoryIds = [...props.categoryIds];
        this._variants = props.variants.map((v) => ({ ...v }));
        this._images = [...props.images];
        this._metadata = props.metadata ?? {};
    }

    // Getters
    get tenantId(): TenantId {
        return this._tenantId;
    }

    get storeId(): string {
        return this._storeId;
    }

    get name(): string {
        return this._name;
    }

    get slug(): string {
        return this._slug;
    }

    get description(): string {
        return this._description;
    }

    get price(): Money {
        return this._price;
    }

    get status(): ProductStatus {
        return this._status;
    }

    get categoryIds(): string[] {
        return [...this._categoryIds];
    }

    get variants(): ProductVariant[] {
        return this._variants.map((v) => ({ ...v }));
    }

    get images(): string[] {
        return [...this._images];
    }

    get isAvailable(): boolean {
        return this._status === ProductStatus.ACTIVE;
    }

    get totalStock(): number {
        if (this._variants.length === 0) return 0;
        return this._variants.reduce((sum, v) => sum + v.stock, 0);
    }

    // Factory Method
    public static create(props: Omit<ProductProps, 'id' | 'status'>): Product {
        return new Product({
            id: crypto.randomUUID(),
            status: ProductStatus.ACTIVE,
            ...props,
        });
    }

    // Reconstitution from persistence
    public static reconstitute(props: ProductProps): Product {
        return new Product(props);
    }

    // Domain Methods
    public activate(): void {
        this._status = ProductStatus.ACTIVE;
        this.touch();
    }

    public deactivate(): void {
        this._status = ProductStatus.INACTIVE;
        this.touch();
    }

    public discontinue(): void {
        this._status = ProductStatus.DISCONTINUED;
        this.touch();
    }

    public updateName(name: string): void {
        if (!name || name.trim().length < 2) {
            throw new Error('Product name must be at least 2 characters');
        }
        this._name = name.trim();
        this.touch();
    }

    public updatePrice(price: Money): void {
        this._price = price;
        this.touch();
    }

    public updateDescription(description: string): void {
        this._description = description;
        this.touch();
    }

    public addCategory(categoryId: string): void {
        if (!this._categoryIds.includes(categoryId)) {
            this._categoryIds.push(categoryId);
            this.touch();
        }
    }

    public removeCategory(categoryId: string): void {
        this._categoryIds = this._categoryIds.filter((id) => id !== categoryId);
        this.touch();
    }

    public addVariant(variant: ProductVariant): void {
        if (this._variants.some((v) => v.sku === variant.sku)) {
            throw new Error(`Variant with SKU ${variant.sku} already exists`);
        }
        this._variants.push({ ...variant });
        this.touch();
    }

    public updateVariantStock(variantId: string, stock: number): void {
        const variant = this._variants.find((v) => v.id === variantId);
        if (!variant) {
            throw new Error(`Variant ${variantId} not found`);
        }
        if (stock < 0) {
            throw new Error('Stock cannot be negative');
        }
        variant.stock = stock;

        // Check if all variants are out of stock
        if (this.totalStock === 0) {
            this._status = ProductStatus.OUT_OF_STOCK;
        }
        this.touch();
    }

    public addImage(imageUrl: string): void {
        if (!this._images.includes(imageUrl)) {
            this._images.push(imageUrl);
            this.touch();
        }
    }

    public removeImage(imageUrl: string): void {
        this._images = this._images.filter((img) => img !== imageUrl);
        this.touch();
    }
}
