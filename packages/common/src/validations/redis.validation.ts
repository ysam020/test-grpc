import z from 'zod';

const clearCacheSchema = z.object({
    pattern: z.string(),
});

type clearCacheType = z.infer<typeof clearCacheSchema>;

export type { clearCacheType };
export { clearCacheSchema };
