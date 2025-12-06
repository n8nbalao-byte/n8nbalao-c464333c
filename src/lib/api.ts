// API Configuration - connects to your PHP backend on Hostinger
const API_BASE_URL = 'https://www.n8nbalao.com/api';

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  categories: string[];
  image: string;
  specs: Record<string, string>;
  totalPrice: number;
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
      const response = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...product,
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
      const response = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...product }),
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
};
