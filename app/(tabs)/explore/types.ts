export interface Product {
  id: string;
  brand: string;
  name: string;
  price: string;
  image: string;
  url: string;
  product_info?: any;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  image?: string;
}

export interface ConversationGroup {
  id: string;
  messages: ChatMessage[];
  products: Product[];
}

export interface UserPersonalization {
  preferences?: any;
  style?: any;
}

export type InputType = 'text' | 'img+txt' | 'image'; 