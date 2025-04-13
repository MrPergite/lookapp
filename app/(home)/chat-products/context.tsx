import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Define types for chat messages
export interface ChatMessage {
  role: 'user' | 'assistant' | 'ai';
  text: string;
  image?: string;
  timestamp?: number;
}

// Define types for product search results
export interface Product {
  id: string;
  brand: string;
  name: string;
  price: string;
  image: string;
  isSaved?: boolean;
  product_info: any;
  url?: string;
}

export interface ConversationGroup {
  id: string;
  userMessage: ChatMessage | null;
  aiMessage: ChatMessage | null;
  products: Product[];
  expanded: boolean;
  pagination: {
    page: number;
    limit: number;
  };
  uiProductsList: Product[];
}
// Context state type
export interface ChatProductsState {
  sessionId?: string;
  chatHistory: ChatMessage[];
  products: Product[];
  isLoading: boolean;
  usedItems: boolean;
  personalization: boolean;
  inputType: 'text' | 'img+txt' | 'imgurl+txt';
  error: string | null;
  showSignInModal: boolean;
  conversationGroups: ConversationGroup[];
  activeConversationGroup: string | null;
}

// Action types
type ActionType =
  | { type: 'ADD_USER_MESSAGE'; payload: { text: string; image?: string } }
  | { type: 'ADD_AI_MESSAGE'; payload: { text: string } }
  | { type: 'SET_PRODUCTS'; payload: { products: Product[]; sessionId: string } }
  | { type: 'ADD_PRODUCTS'; payload: { products: Product[]; sessionId: string; aiResponse: string } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'TOGGLE_USED_ITEMS'; payload?: undefined }
  | { type: 'TOGGLE_PERSONALIZATION'; payload?: undefined }
  | { type: 'SET_INPUT_TYPE'; payload: { inputType: 'text' | 'img+txt' | 'imgurl+txt' } }
  | { type: 'CLEAR_CHAT'; payload?: undefined }
  | { type: 'RESET'; payload?: undefined }
  | { type: 'TOGGLE_SIGN_IN_MODAL'; payload?: undefined }
  | { type: 'REMOVE_USER_MESSAGE'; }
  | { type: 'REMOVE_AI_MESSAGE' }
  | { type: 'GET_MORE_PRODUCTS'; payload: { activeConversationGroup: string } };

// Context type
interface ChatProductsContextType extends ChatProductsState {
  dispatch: Dispatch<ActionType>;
}

// Initial state
const initialState: ChatProductsState = {
  chatHistory: [],
  products: [],
  isLoading: false,
  usedItems: false,
  personalization: false,
  inputType: 'text',
  error: null,
  showSignInModal: false,
  conversationGroups: [],
  activeConversationGroup: null
};

// Create context
const ChatProductsContext = createContext<ChatProductsContextType | undefined>(undefined);

// Reducer function
const chatProductsReducer = (state: ChatProductsState, action: ActionType): ChatProductsState => {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      const newId = uuidv4();
      return {
        ...state,
        conversationGroups: [
          ...state.conversationGroups,
          {
            id: newId,
            userMessage: { role: 'user', text: action.payload.text, image: action.payload.image, timestamp: Date.now() },
            aiMessage: null,
            products: [],
            expanded: false,
            pagination: { page: 1, limit: 4 },
            uiProductsList: []
          }
        ],
        activeConversationGroup: newId
      }
    // return {
    //   ...state,
    //   chatHistory: [
    //     ...state.chatHistory,
    //     {
    //       role: 'user',
    //       text: action.payload.text,
    //       ...(action.payload.image ? { image: action.payload.image } : {}),
    //       timestamp: Date.now()
    //     }
    //   ]
    // };

    case 'ADD_AI_MESSAGE':
      return {
        ...state,
        conversationGroups: state.conversationGroups.map(group =>
          group.id === state.activeConversationGroup
            ? { ...group, aiMessage: { role: 'ai', text: action.payload.text, timestamp: Date.now() } }
            : group
        )
      };

    case 'SET_PRODUCTS':
      return {
        ...state,
        conversationGroups: state.conversationGroups.map(group =>
          group.id === state.activeConversationGroup
            ? { ...group, products: action.payload.products }
            : group
        ),
        sessionId: action.payload.sessionId
      };

    case 'ADD_PRODUCTS':
      // Group products by search query, maintaining the order
      const initialProducts = action.payload.products.slice(0, 4);
      return {
        ...state,
        conversationGroups: state.conversationGroups.map(group =>
          group.id === state.activeConversationGroup
            ? {
              ...group, products: [...group.products, ...action.payload.products],
              uiProductsList: [...group.uiProductsList, ...initialProducts],
              pagination: {
                page: 1,
                limit: group.pagination.limit
              }
            }
            : group
        ),
        sessionId: action.payload.sessionId
      };

    case "GET_MORE_PRODUCTS":
      const activeGroup = state.conversationGroups.find(group => group.id === action.payload.activeConversationGroup);
      if (!activeGroup) return state;
      const newProducts = activeGroup.products.slice(activeGroup.uiProductsList.length, activeGroup.uiProductsList.length + activeGroup.pagination.limit);
      return {
        ...state,
        conversationGroups: state.conversationGroups.map(group =>
          group.id === state.activeConversationGroup
            ? {
              ...group, uiProductsList: [...group.uiProductsList, ...newProducts],
              pagination: {
                page: activeGroup.pagination.page + 1,
                limit: activeGroup.pagination.limit
              }
            }
            : group
        )
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error
      };

    case 'TOGGLE_USED_ITEMS':
      return {
        ...state,
        usedItems: !state.usedItems
      };

    case 'TOGGLE_PERSONALIZATION':
      return {
        ...state,
        personalization: !state.personalization
      };

    case 'SET_INPUT_TYPE':
      return {
        ...state,
        inputType: action.payload.inputType
      };

    case 'CLEAR_CHAT':
      return {
        ...state,
        chatHistory: [],
        products: []
      };

    case 'TOGGLE_SIGN_IN_MODAL':
      return {
        ...state,
        showSignInModal: !state.showSignInModal
      };
    case 'REMOVE_USER_MESSAGE':
      return {
        ...state,
        chatHistory: state.chatHistory.filter((message, ind) => ind !== state.chatHistory.length - 2)
      };
    case 'REMOVE_AI_MESSAGE':
      return {
        ...state,
        chatHistory: state.chatHistory.filter((message, ind) => ind !== state.chatHistory.length - 1)
      };
    case 'RESET':
      return {
        ...initialState,
        sessionId: undefined
      };

    default:
      return state;
  }
};

// Provider component
export const ChatProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatProductsReducer, initialState);

  return (
    <ChatProductsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ChatProductsContext.Provider>
  );
};

// Custom hook to use the chat products context
export const useChatProducts = (): ChatProductsContextType => {
  const context = useContext(ChatProductsContext);

  if (context === undefined) {
    throw new Error('useChatProducts must be used within a ChatProductsProvider');
  }

  return context;
};

// Action creators for commonly used actions
export const chatActions = {
  addUserMessage: (text: string, image?: string) => ({
    type: 'ADD_USER_MESSAGE' as const,
    payload: { text, image }
  }),

  getMoreProducts: (activeConversationGroup: string) => ({
    type: 'GET_MORE_PRODUCTS' as const,
    payload: { activeConversationGroup }
  }),

  addAiMessage: (text: string) => ({
    type: 'ADD_AI_MESSAGE' as const,
    payload: { text }
  }),

  removeUserMessage: () => ({
    type: 'REMOVE_USER_MESSAGE' as const,
  }),

  removeAiMessage: () => ({
    type: 'REMOVE_AI_MESSAGE' as const,
  }),

  setProducts: (products: Product[], sessionId: string) => ({
    type: 'SET_PRODUCTS' as const,
    payload: { products, sessionId }
  }),

  addProducts: (products: Product[], sessionId: string, aiResponse: string) => ({
    type: 'ADD_PRODUCTS' as const,
    payload: { products, sessionId, aiResponse }
  }),

  setLoading: (isLoading: boolean) => ({
    type: 'SET_LOADING' as const,
    payload: { isLoading }
  }),

  setError: (error: string | null) => ({
    type: 'SET_ERROR' as const,
    payload: { error }
  }),

  toggleUsedItems: () => ({
    type: 'TOGGLE_USED_ITEMS' as const
  }),

  togglePersonalization: () => ({
    type: 'TOGGLE_PERSONALIZATION' as const
  }),

  setInputType: (inputType: 'text' | 'img+txt' | 'imgurl+txt') => ({
    type: 'SET_INPUT_TYPE' as const,
    payload: { inputType }
  }),

  clearChat: () => ({
    type: 'CLEAR_CHAT' as const
  }),
  toggleSignInModal: (showSignInModal: boolean) => ({
    type: 'TOGGLE_SIGN_IN_MODAL' as const,
    payload: { showSignInModal }
  }),

  reset: () => ({
    type: 'RESET' as const
  })
}; 