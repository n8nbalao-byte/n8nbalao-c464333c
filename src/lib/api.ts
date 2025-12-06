// API Configuration - connects to your PHP backend on Hostinger
const API_BASE_URL = 'https://www.n8nbalao.com/api';

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  categories: string[];
  media: MediaItem[];
  specs: Record<string, string>;
  components: ProductComponents;
  totalPrice: number;
  createdAt: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface ProductComponents {
  processor?: HardwareItem;
  motherboard?: HardwareItem;
  memory?: HardwareItem;
  storage?: HardwareItem;
  gpu?: HardwareItem;
  psu?: HardwareItem;
  case?: HardwareItem;
}

// Component IDs only for saving to database (lighter payload)
export interface ProductComponentIds {
  processor?: string;
  motherboard?: string;
  memory?: string;
  storage?: string;
  gpu?: string;
  psu?: string;
  case?: string;
}

// Helper to extract only IDs from components
function extractComponentIds(components: ProductComponents): ProductComponentIds {
  const ids: ProductComponentIds = {};
  for (const [key, value] of Object.entries(components)) {
    if (value?.id) {
      ids[key as keyof ProductComponentIds] = value.id;
    }
  }
  return ids;
}

export interface HardwareItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  specs: Record<string, string>;
  category: 'processor' | 'motherboard' | 'memory' | 'storage' | 'gpu' | 'psu' | 'case';
  createdAt: string;
}

export const api = {
  // Fetch all products
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products.php`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Fetch single product by ID
  async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/products.php?id=${id}`);
      if (!response.ok) throw new Error('Product not found');
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Create a new product
  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      // Extract only component IDs to reduce payload size
      const componentIds = extractComponentIds(product.components);
      
      const response = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...product,
          components: componentIds, // Only IDs, not full objects
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating product:', error);
      return false;
    }
  },

  // Update a product
  async updateProduct(id: string, product: Partial<Product>): Promise<boolean> {
    try {
      // Extract only component IDs if components are provided
      const payload: Record<string, unknown> = { id, ...product };
      if (product.components) {
        payload.components = extractComponentIds(product.components);
      }
      
      const response = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  },

  // Delete a product
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/products.php?id=${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  },

  // Hardware endpoints
  async getHardware(category?: string): Promise<HardwareItem[]> {
    try {
      const url = category 
        ? `${API_BASE_URL}/hardware.php?category=${category}`
        : `${API_BASE_URL}/hardware.php`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch hardware');
      return await response.json();
    } catch (error) {
      console.error('Error fetching hardware:', error);
      return [];
    }
  },

  async createHardware(hardware: Omit<HardwareItem, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/hardware.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...hardware,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating hardware:', error);
      return false;
    }
  },

  async updateHardware(id: string, hardware: Partial<HardwareItem>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/hardware.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...hardware }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating hardware:', error);
      return false;
    }
  },

  async deleteHardware(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/hardware.php?id=${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting hardware:', error);
      return false;
    }
  },
};
