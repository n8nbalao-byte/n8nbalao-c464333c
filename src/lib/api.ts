// API Configuration - connects to your PHP backend on Hostinger
const API_BASE_URL = 'https://www.n8nbalao.com/api';

// =====================================================
// UNIFIED CATEGORY SYSTEM
// =====================================================

// Unified category interface - used for ALL categories (products, hardware subcategories, etc.)
export interface Category {
  key: string;
  label: string;
  icon?: string;
  parentKey?: string | null; // null = top-level, 'hardware' = hardware subcategory
  isSystem?: boolean; // System categories cannot be deleted (e.g., 'hardware')
  sortOrder?: number;
  filters?: {
    field: string;
    label: string;
    options: string[];
  }[];
}

// Fetch all categories (top-level only by default)
export async function getCategories(options?: { parent?: string | null; all?: boolean }): Promise<Category[]> {
  try {
    let url = `${API_BASE_URL}/categories.php`;
    const params = new URLSearchParams();
    
    if (options?.all) {
      params.append('all', 'true');
    } else if (options?.parent !== undefined) {
      params.append('parent', options.parent === null ? 'null' : options.parent);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

// Add a new category
export async function addCategory(category: Omit<Category, 'isSystem'>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Update a category
export async function updateCategory(key: string, updates: Partial<Category> & { newLabel?: string; newIcon?: string; newKey?: string }): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, ...updates }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Delete a category (system categories cannot be deleted)
export async function deleteCategory(key: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php?key=${key}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// =====================================================
// LEGACY COMPATIBILITY - These map to the new unified system
// =====================================================

export type ProductCategory = string;

export interface CustomCategory {
  key: string;
  label: string;
  icon?: string;
  type?: string;
}

// Legacy: Get product categories (top-level, excluding 'hardware')
export async function getCustomCategories(): Promise<CustomCategory[]> {
  const categories = await getCategories({ parent: null });
  return categories.map(c => ({ key: c.key, label: c.label, icon: c.icon }));
}

// Legacy: Add product category
export async function addCustomCategory(key: string, label: string, icon?: string): Promise<boolean> {
  return addCategory({ key, label, icon, parentKey: null });
}

// Legacy: Remove product category
export async function removeCustomCategory(key: string): Promise<boolean> {
  return deleteCategory(key);
}

// Legacy: Update product category
export async function updateCustomCategory(key: string, newLabel: string, newIcon?: string, newKey?: string): Promise<boolean> {
  return updateCategory(key, { newLabel, newIcon, newKey });
}

// Hardware category type (legacy compatibility)
export type HardwareCategory = string;

export interface HardwareCategoryDef {
  key: string;
  label: string;
  icon?: string;
  filters?: {
    field: string;
    label: string;
    options: string[];
  }[];
}

// Legacy: Get hardware subcategories
export async function getHardwareCategories(): Promise<HardwareCategoryDef[]> {
  const categories = await getCategories({ parent: 'hardware' });
  return categories.map(c => ({ 
    key: c.key, 
    label: c.label, 
    icon: c.icon,
    filters: c.filters 
  }));
}

// Legacy: Add hardware subcategory
export async function addHardwareCategory(category: HardwareCategoryDef): Promise<boolean> {
  return addCategory({ 
    key: category.key, 
    label: category.label, 
    icon: category.icon,
    parentKey: 'hardware',
    filters: category.filters
  });
}

// Legacy: Update hardware subcategory
export async function updateHardwareCategory(key: string, category: Partial<HardwareCategoryDef>): Promise<boolean> {
  return updateCategory(key, { 
    newLabel: category.label,
    newIcon: category.icon,
    filters: category.filters
  });
}

// Legacy: Remove hardware subcategory
export async function removeHardwareCategory(key: string): Promise<boolean> {
  return deleteCategory(key);
}

// =====================================================
// PRODUCT & HARDWARE TYPES
// =====================================================

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  categories: string[];
  media: MediaItem[];
  specs: Record<string, string>;
  components: ProductComponents;
  totalPrice: number;
  createdAt: string;
  downloadUrl?: string;
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
  category: HardwareCategory;
  createdAt: string;
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
  // Theme colors
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
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

// =====================================================
// AI USAGE TRACKING
// =====================================================

export interface AIUsageData {
  operationType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  costBrl: number;
  itemsProcessed?: number;
}

export interface AIUsageTotals {
  total_operations: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
  total_cost_brl: number;
  total_items_processed: number;
}

export interface AIUsageBreakdown {
  operation_type: string;
  operations: number;
  tokens: number;
  cost_usd: number;
  cost_brl: number;
}

export async function logAIUsage(usage: AIUsageData): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-usage.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usage),
    });
    return response.ok;
  } catch {
    console.error('Error logging AI usage');
    return false;
  }
}

export async function getAIUsage(period: 'all' | 'today' | 'week' | 'month' = 'all'): Promise<{
  totals: AIUsageTotals;
  breakdown: AIUsageBreakdown[];
  recent: any[];
} | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-usage.php?period=${period}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

// =====================================================
// API OBJECT
// =====================================================

export const api = {
  // Products
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

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      const componentIds = product.components ? extractComponentIds(product.components) : {};
      
      const response = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          components: componentIds,
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

  async updateProduct(id: string, product: Partial<Product>): Promise<boolean> {
    try {
      const payload: Record<string, unknown> = { id, ...product };
      if (product.components) {
        payload.components = extractComponentIds(product.components);
      }
      
      const response = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  },

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

  async deleteAllProducts(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/products.php?all=true`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting all products:', error);
      return false;
    }
  },

  // Hardware
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

  // Company
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

  // Customers
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

  // Orders
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

  // Carousels - supports both string[] (legacy) and CarouselImage[] (new format with links)
  async getCarousel(key: string): Promise<{ key: string; images: (string | { url: string; link?: string })[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/carousels.php?key=${key}`);
      if (!response.ok) return { key, images: [] };
      return await response.json();
    } catch (error) {
      console.error('Error fetching carousel:', error);
      return { key, images: [] };
    }
  },

  async saveCarousel(key: string, images: (string | { url: string; link?: string })[]): Promise<boolean> {
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
