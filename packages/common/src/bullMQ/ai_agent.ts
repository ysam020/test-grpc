import { ChatOpenAI } from '@langchain/openai';
import { traceable } from 'langsmith/traceable';
import { logger } from '@atc/logger';
import { unwrapCodeFence } from './helper';

const llm = new ChatOpenAI({
    model: 'gpt-4.1-mini',
});

type ProductItem = {
    product_name: string;
    price: number;
    discount?: string | null;
    brand_name?: string | null;
};

export const imageScan = traceable(async function imageScan({
    imageBuffer,
}: {
    imageBuffer: Buffer;
}): Promise<ProductItem[]> {
    try {
        const imageBase64 = imageBuffer.toString('base64');

        const visionResponse = await llm.invoke([
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `You are an intelligent AI assistant designed to extract structured data from supermarket catalog images.

                                Please analyze the image and return a structured list of all products shown in the catalog, including:

                                - product_name: Full product name as shown in the image (including brand, pack size, etc. – do not modify it).
                                - brand_name: If the brand name appears at the start of the product name or is clearly shown, extract just the brand portion (copy it exactly). Do not guess or try to separate brand from product_name manually.

                                Return the output in JSON format, like:
                                [
                                    {
                                        "brand_name": "Parle",
                                        "product_name": "Parle-G Biscuits",
                                        "price": "10",
                                        "discount": "20% off"
                                    }
                                ]

                                If a brand isn't visible or obvious, leave brand_name as null.`,
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBase64}`,
                        },
                    },
                ],
            },
        ]);

        let raw =
            typeof visionResponse === 'string'
                ? visionResponse
                : visionResponse.content;

        if (typeof raw !== 'string') {
            throw new Error('Vision did not return a string');
        }

        raw = unwrapCodeFence(raw);

        let products: any[];
        try {
            products = JSON.parse(raw);
        } catch (err) {
            logger.error('Raw after unwrap:', raw);
            throw new Error(
                'Failed to JSON.parse Vision output: ' +
                    (err instanceof Error ? err.message : String(err)),
            );
        }

        const cleaned: ProductItem[] = products.map((p) => {
            const numStr = (p.price ?? '').replace(/[^0-9.]+/g, '');
            const priceNum = parseFloat(numStr) || 0;

            return {
                product_name: p.product_name?.trim(),
                price: priceNum,
                discount: p.discount ?? null,
                brand_name: p.brand_name?.trim() || null,
            };
        });

        return cleaned;
    } catch (error) {
        logger.error('Error in imageScan:', error);
        return [];
    }
});
