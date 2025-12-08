// API Configuration - connects to your PHP backend on Hostinger
const API_BASE_URL = 'https://www.n8nbalao.com/api';

export type ProductCategory = 'pc' | 'kit' | 'notebook' | 'automacao' | 'software' | 'acessorio' | 'licenca' | 'monitor' | 'cadeira_gamer';

// Custom categories stored in database
export interface CustomCategory {
  key: string;
  label: string;
  icon?: string;
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

// Update category in database
export async function updateCustomCategory(key: string, newLabel: string, newIcon?: string, newKey?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, newLabel, newIcon, newKey }),
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
  description?: string; // Free text field for product details
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

// Hardware is for PC components only - dynamic from database
export type HardwareCategory = string;

// Hardware category definition
export interface HardwareCategoryDef {
  key: string;
  label: string;
  icon?: string;
  // Filter options for this category
  filters?: {
    field: string;
    label: string;
    options: string[];
  }[];
}

// Fetch hardware categories from database
export async function getHardwareCategories(): Promise<HardwareCategoryDef[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php?type=hardware_category`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// Add hardware category
export async function addHardwareCategory(category: HardwareCategoryDef): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...category, type: 'hardware_category' }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Update hardware category
export async function updateHardwareCategory(key: string, category: Partial<HardwareCategoryDef>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        key, 
        type: 'hardware_category', 
        newLabel: category.label,
        newIcon: category.icon,
        filters: category.filters
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Remove hardware category
export async function removeHardwareCategory(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php?key=${key}&type=hardware_category`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch {
    return false;
  }
}

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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
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

  // Customer endpoints
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/customers.php`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },

  async getCustomer(id: string): Promise<Customer | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/customers.php?id=${id}`);
      if (!response.ok) throw new Error('Customer not found');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  },

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/customers.php?id=${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  },

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders.php`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  async getOrder(id: string): Promise<Order | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders.php?id=${id}`);
      if (!response.ok) throw new Error('Order not found');
      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  async updateOrderStatus(id: string, status: Order['status'], notes?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  },

  async deleteOrder(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  },

  // Carousel endpoints
  async getCarousel(key: string): Promise<{ key: string; images: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/carousels.php?key=${key}`);
      if (!response.ok) return { key, images: [] };
      return await response.json();
    } catch (error) {
      console.error('Error fetching carousel:', error);
      return { key, images: [] };
    }
  },

  async saveCarousel(key: string, images: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/carousels.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, images }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error saving carousel:', error);
      return false;
    }
  },
};
