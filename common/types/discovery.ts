export interface ShoppingResult {
  product_id: string;
  title: string;
  price: string;
  img_url: string;
  brand: string;
  link: string;
}

export interface DiscoveryOutfit {
  outfit_title: string;
  outfit_img_url: string;
  price: string; // This seems to be the total price for the outfit
  shopping_results: ShoppingResult[];
}

export interface DiscoveryApiResponse {
  items: DiscoveryOutfit[];
  total_items: number;
} 