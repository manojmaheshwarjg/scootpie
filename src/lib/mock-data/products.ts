const mockProductsBase = [
  {
    externalId: 'PROD001',
    name: 'Classic Blue Denim Jacket',
    brand: 'Urban Style',
    price: 89.99,
    currency: 'USD',
    retailer: 'Fashion Hub',
    category: 'Outerwear',
    subcategory: 'Jackets',
    imageUrl: 'https://images.unsplash.com/photo-1543076659-9380cdf10613?w=800',
    productUrl: 'https://example.com/product/1',
    description: 'Classic blue denim jacket with button closure and chest pockets',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Light Blue', 'Black'],
    inStock: true,
    trending: true,
    isNew: false,
    isEditorial: false,
  },
  {
    externalId: 'PROD002',
    name: 'Floral Summer Dress',
    brand: 'Blossom & Co',
    price: 129.99,
    currency: 'USD',
    retailer: 'Style Market',
    category: 'Dresses',
    subcategory: 'Casual Dresses',
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
    productUrl: 'https://example.com/product/2',
    description: 'Elegant floral print summer dress with flowy silhouette',
    availableSizes: ['XS', 'S', 'M', 'L'],
    colors: ['Floral Blue', 'Floral Pink', 'White'],
    inStock: true,
    trending: true,
    isNew: true,
    isEditorial: false,
  },
  {
    externalId: 'PROD003',
    name: 'Minimalist White T-Shirt',
    brand: 'Essential Basics',
    price: 29.99,
    currency: 'USD',
    retailer: 'Everyday Wear',
    category: 'Tops',
    subcategory: 'T-Shirts',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    productUrl: 'https://example.com/product/3',
    description: 'Classic white crew neck t-shirt, 100% cotton',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Black', 'Gray', 'Navy'],
    inStock: true,
    trending: false,
    isNew: false,
    isEditorial: true,
  },
  {
    externalId: 'PROD004',
    name: 'High-Waisted Black Jeans',
    brand: 'Denim Dreams',
    price: 79.99,
    currency: 'USD',
    retailer: 'Fashion Hub',
    category: 'Bottoms',
    subcategory: 'Jeans',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
    productUrl: 'https://example.com/product/4',
    description: 'High-waisted skinny black jeans with stretch fabric',
    availableSizes: ['24', '26', '28', '30', '32'],
    colors: ['Black', 'Dark Gray', 'Blue Black'],
    inStock: true,
    trending: true,
    isNew: false,
    isEditorial: false,
  },
  {
    externalId: 'PROD005',
    name: 'Elegant Blazer',
    brand: 'Professional Line',
    price: 159.99,
    currency: 'USD',
    retailer: 'Work Wardrobe',
    category: 'Outerwear',
    subcategory: 'Blazers',
    imageUrl: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800',
    productUrl: 'https://example.com/product/5',
    description: 'Tailored blazer perfect for office wear and formal occasions',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Charcoal', 'Camel'],
    inStock: true,
    trending: false,
    isNew: true,
    isEditorial: true,
  },
];

export function getMockProducts(count: number = 15) {
  const extendedProducts = [];
  
  for (let i = 0; i < count; i++) {
    const baseProduct = mockProductsBase[i % mockProductsBase.length];
    extendedProducts.push({
      id: crypto.randomUUID(),
      ...baseProduct,
    });
  }
  
  return extendedProducts;
}

export function getProductById(id: string) {
  const products = getMockProducts(mockProductsBase.length);
  return products.find(p => p.id === id);
}

export function getProductsByCategory(category: string) {
  return getMockProducts(10).filter(p => p.category === category);
}

export function getTrendingProducts() {
  return getMockProducts(10).filter(p => p.trending);
}

export function getNewProducts() {
  return getMockProducts(10).filter(p => p.isNew);
}

export function getEditorialProducts() {
  return getMockProducts(10).filter(p => p.isEditorial);
}
