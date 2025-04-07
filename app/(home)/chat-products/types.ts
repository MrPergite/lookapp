/**
 * Types for chat products and product details
 */

/**
 * Represents a product size option
 */
export interface ProductSize {
  size: string;
  product_id: string;
}

/**
 * Represents detailed product information
 */
export interface ProductDetails {
  product_id: string;
  img_urls_list: string[];
  price: string;
  product_link: string;
  default_size?: string;
  sizes?: ProductSize[];
  size?: string;
  description?: string;
}

/**
 * Represents a color variation of a product with all its details
 */
export interface ProductColorVariation {
  product_id: string;
  img_urls_list: string[];
  price: string;
  product_link: string;
  default_size?: string;
  sizes?: ProductSize[];
  thumbnail?: string;
}

/**
 * Response structure from product-details API
 */
export interface ProductDetailsResponse {
  colors: ProductColorVariation[];
}

/**
 * Request structure for product-details API
 */
export interface ProductDetailsRequest {
  product_id: string;
}

/**
 * For use in shopping list and product reaction APIs
 */
export interface ProductReactionPayload {
  data: {
    product_id: string;
    source: string;
  };
  metadata: {
    title: string;
    is_topwear: boolean;
    product_link: string;
    img_url: string;
    product_price: string;
    brand: string;
  };
  info: {
    fetchedProductInfo: boolean;
  };
}