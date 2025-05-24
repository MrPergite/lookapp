export const transformShoppingList = (shoppingList: any[]) => {
  return shoppingList.map(item => ({
    id: item.id,
    name: item.name,
    brand: item.brand,
    price: item.price,
    imageUrl: item.image_url,
    description: item.description,
    category: item.category,
    url: item.url
  }));
};

export const extractImageUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}; 