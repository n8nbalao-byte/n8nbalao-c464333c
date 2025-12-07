// API Configuration - connects to your PHP backend on Hostinger
const API_BASE_URL = 'https://www.n8nbalao.com/api';

export type ProductCategory = 'pc' | 'kit' | 'notebook' | 'automacao' | 'software' | 'acessorio' | 'licenca' | 'monitor' | 'cadeira_gamer';

// Custom categories stored in database
export interface CustomCategory {
  key: string;
  label: string;
  icon?: string; // Icon key from availableIcons
  type?: 'product_type' | 'product_category';
}

// Fetch custom categories from database
export async function getCustomCategories(): Promise<CustomCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php?type=product_type`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// Save category to database
export async function addCustomCategory(key: string, label: string, icon?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, label, icon, type: 'product_type' }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Remove category from database
export async function removeCustomCategory(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php?key=${key}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch {
    return false;
  }
}

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
  // For automações - download link
  downloadUrl?: string;
  // Product type to identify if it's a PC assembly or simple product
  productType?: ProductCategory;
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
  cooler?: HardwareItem;
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
  cooler?: string;
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

// Hardware is for PC components only
export type HardwareCategory = 'processor' | 'motherboard' | 'memory' | 'storage' | 'gpu' | 'psu' | 'case' | 'cooler';

export interface HardwareItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  specs: Record<string, string>;
  category: HardwareCategory;
  createdAt: string;
  // Compatibility fields
  socket?: string;
  memoryType?: string;
  formFactor?: string;
  tdp?: number;
}

export interface CompanyData {
  id?: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  cnpj: string;
  seller: string;
  logo: string;
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
      // Extract only component IDs to reduce payload size (for PC products)
      const componentIds = product.components ? extractComponentIds(product.components) : {};
      
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

  // Hardware endpoints (only for PC components)
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

  // Company endpoints
  async getCompany(): Promise<CompanyData> {
    try {
      const response = await fetch(`${API_BASE_URL}/company.php`);
      if (!response.ok) throw new Error('Failed to fetch company data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching company:', error);
      return {
        name: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        cnpj: '',
        seller: '',
        logo: ''
      };
    }
  },

  async saveCompany(data: CompanyData): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/company.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving company:', error);
      return false;
    }
  },
};
