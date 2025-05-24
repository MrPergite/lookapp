import axios, { AxiosRequestConfig } from "axios";
import { applyHeaders } from '../utils';

// Define the payload type
interface DiscoveryPayload {
    pagination: {
        page_size: number;
        page_number: number;
    };
    gender: string;
}

function transformOutfitContract(apiResponse: any) {
    return {
      total_items: apiResponse.total_items,
      items: apiResponse.items.map((outfit: any) => ({
        // slugify the title to create an "id"
        id: outfit.outfit_title
          .toLowerCase()
          .replace(/[\W_]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        imageUrl: outfit.outfit_img_url,
        title: outfit.outfit_title,
        subtitle: outfit.price, // you can swap this for any descriptive text
        products: outfit.shopping_results.map((p: any) => ({
          id: p.product_id,
          name: p.title,
        //   price: p.price,
          imageUrl: p.img_url,
        //   brand: p.brand,
        //   link: p.link
        }))
      }))
    };
  }

export async function POST(request: Request) {
    try {
        const payload = await request.json() as DiscoveryPayload;
        const { pagination, gender } = payload;

        // Prepare headers for Axios as a plain object
        const plainHeaders: Record<string, string> = {};
        const customHeadersFromApply = await applyHeaders(request); // Assume this returns Headers or similar

        if (customHeadersFromApply) {
            if (typeof customHeadersFromApply.forEach === 'function') {
                 // @ts-ignore Standard Headers object with forEach
                customHeadersFromApply.forEach((value, key) => {
                    plainHeaders[key] = value;
                });
            } else if (typeof customHeadersFromApply === 'object') {
                // If it's already a plain object-like structure (but not a Headers instance)
                // This part is tricky without knowing the exact return type of applyHeaders
                // For safety, iterate if possible, or directly assign if known to be plain
                for (const key in customHeadersFromApply) {
                    if (Object.prototype.hasOwnProperty.call(customHeadersFromApply, key)) {
                         // @ts-ignore
                        plainHeaders[key] = customHeadersFromApply[key] as string;
                    }
                }
            }
        }

        const axiosConfig: AxiosRequestConfig = {
            headers: plainHeaders
        };

        const userResponse = await axios.post(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/users/discovery`,
            {
                pagination: pagination,
                gender: gender
            },
            axiosConfig // Pass the config object with plain headers
        );
        
        // Assuming the external API returns data that transformOutfitContract expects
        const responseData = transformOutfitContract(userResponse.data);
        // console.log("response1", responseData.items[0].products); // Keep for debugging if needed
        
        // Return a standard Response object with JSON data
        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error("Discovery API error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load your discovery outfits';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
