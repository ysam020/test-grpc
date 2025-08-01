import z from 'zod';
import { ExcelReportType } from './types/sample.types';

const UUIDSchema = z.object({ id: z.string().trim().uuid() });

const optionalUUIDSchema = z.object({
    id: z.string().trim().uuid().optional(),
});

const ExportTypeSchema = z.object({ type: z.nativeEnum(ExcelReportType) });

export { UUIDSchema, ExportTypeSchema, optionalUUIDSchema };
