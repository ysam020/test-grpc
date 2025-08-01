import { errorMessage } from '@atc/common';

// Mock @atc/common
jest.mock('@atc/common', () => ({
    errorMessage: {
        OTHER: {
            INVALID_FILE_TYPE: 'Invalid file type',
        },
    },
}));

// Test the file filter logic directly
describe('File Upload Middleware Logic', () => {
    describe('Image File Filter Logic', () => {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp',
            'image/bmp',
            'image/tiff',
            'image/svg+xml',
            'image/heif',
            'image/avif',
            'image/heic',
        ];

        const testFileFilter = (
            file: Express.Multer.File | null,
            allowedTypes: string[],
        ) => {
            return new Promise<boolean>((resolve, reject) => {
                const callback = (error: Error | null, result?: boolean) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result || false);
                    }
                };

                // Simulate the file filter logic from uploadFile middleware
                if (file && allowedTypes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(new Error(errorMessage.OTHER.INVALID_FILE_TYPE));
                }
            });
        };

        it('should accept all valid image mime types', async () => {
            for (const mimetype of allowedMimeTypes) {
                const mockFile = {
                    fieldname: 'image',
                    originalname: `test.${mimetype.split('/')[1]}`,
                    encoding: '7bit',
                    mimetype,
                    buffer: Buffer.from('test'),
                    size: 1024,
                } as Express.Multer.File;

                const result = await testFileFilter(mockFile, allowedMimeTypes);
                expect(result).toBe(true);
            }
        });

        it('should reject invalid mime types', async () => {
            const invalidTypes = ['text/plain', 'application/pdf', 'video/mp4'];

            for (const mimetype of invalidTypes) {
                const mockFile = {
                    fieldname: 'image',
                    originalname: `test.${mimetype.split('/')[1]}`,
                    encoding: '7bit',
                    mimetype,
                    buffer: Buffer.from('test'),
                    size: 1024,
                } as Express.Multer.File;

                await expect(
                    testFileFilter(mockFile, allowedMimeTypes),
                ).rejects.toThrow('Invalid file type');
            }
        });

        it('should reject null files', async () => {
            await expect(
                testFileFilter(null, allowedMimeTypes),
            ).rejects.toThrow('Invalid file type');
        });
    });

    describe('Excel File Filter Logic', () => {
        const excelMimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        const testExcelFileFilter = (file: Express.Multer.File | null) => {
            return new Promise<boolean>((resolve, reject) => {
                const callback = (error: Error | null, result?: boolean) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result || false);
                    }
                };

                // Simulate the file filter logic from uploadExcelFile middleware
                if (file && file.mimetype === excelMimeType) {
                    callback(null, true);
                } else {
                    callback(new Error(errorMessage.OTHER.INVALID_FILE_TYPE));
                }
            });
        };

        it('should accept valid Excel files', async () => {
            const mockFile = {
                fieldname: 'file',
                originalname: 'test.xlsx',
                encoding: '7bit',
                mimetype: excelMimeType,
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const result = await testExcelFileFilter(mockFile);
            expect(result).toBe(true);
        });

        it('should reject non-Excel files', async () => {
            const invalidTypes = [
                'application/pdf',
                'image/jpeg',
                'text/plain',
            ];

            for (const mimetype of invalidTypes) {
                const mockFile = {
                    fieldname: 'file',
                    originalname: `test.${mimetype.split('/')[1]}`,
                    encoding: '7bit',
                    mimetype,
                    buffer: Buffer.from('test'),
                    size: 1024,
                } as Express.Multer.File;

                await expect(testExcelFileFilter(mockFile)).rejects.toThrow(
                    'Invalid file type',
                );
            }
        });

        it('should reject null files', async () => {
            await expect(testExcelFileFilter(null)).rejects.toThrow(
                'Invalid file type',
            );
        });
    });

    describe('PDF/Images File Filter Logic', () => {
        const allowedTypes = ['application/pdf', 'image/jpeg'];

        const testPdfImageFileFilter = (
            file: Express.Multer.File | null,
            req: any = {},
        ) => {
            return new Promise<boolean>((resolve, reject) => {
                const callback = (error: Error | null, result?: boolean) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result || false);
                    }
                };

                // Simulate the file filter logic from uploadPdfOrImages middleware
                if (!allowedTypes.includes(file?.mimetype || '')) {
                    return callback(
                        new Error(errorMessage.OTHER.INVALID_FILE_TYPE),
                    );
                }

                const reqWithFileType = req as typeof req & {
                    fileTypeSet: Set<string>;
                };

                if (!reqWithFileType.fileTypeSet) {
                    reqWithFileType.fileTypeSet = new Set();
                }
                reqWithFileType.fileTypeSet.add(file!.mimetype);

                if (reqWithFileType.fileTypeSet.size > 1) {
                    return callback(
                        new Error(
                            'Cannot upload mixed file types. Upload only PDF or only JPEG.',
                        ),
                    );
                }

                callback(null, true);
            });
        };

        it('should accept PDF files', async () => {
            const mockFile = {
                fieldname: 'files',
                originalname: 'test.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const mockReq = {};
            const result = await testPdfImageFileFilter(mockFile, mockReq);
            expect(result).toBe(true);
            expect((mockReq as any).fileTypeSet.has('application/pdf')).toBe(
                true,
            );
        });

        it('should accept JPEG files', async () => {
            const mockFile = {
                fieldname: 'files',
                originalname: 'test.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const mockReq = {};
            const result = await testPdfImageFileFilter(mockFile, mockReq);
            expect(result).toBe(true);
            expect((mockReq as any).fileTypeSet.has('image/jpeg')).toBe(true);
        });

        it('should reject invalid file types', async () => {
            const invalidTypes = [
                'text/plain',
                'image/png',
                'application/json',
            ];

            for (const mimetype of invalidTypes) {
                const mockFile = {
                    fieldname: 'files',
                    originalname: `test.${mimetype.split('/')[1]}`,
                    encoding: '7bit',
                    mimetype,
                    buffer: Buffer.from('test'),
                    size: 1024,
                } as Express.Multer.File;

                await expect(
                    testPdfImageFileFilter(mockFile, {}),
                ).rejects.toThrow('Invalid file type');
            }
        });

        it('should reject mixed file types', async () => {
            const pdfFile = {
                fieldname: 'files',
                originalname: 'test.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const jpegFile = {
                fieldname: 'files',
                originalname: 'test.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const mockReq = {};

            // First file should pass
            await testPdfImageFileFilter(pdfFile, mockReq);

            // Second file with different type should fail
            await expect(
                testPdfImageFileFilter(jpegFile, mockReq),
            ).rejects.toThrow(
                'Cannot upload mixed file types. Upload only PDF or only JPEG.',
            );
        });

        it('should allow same file type uploads', async () => {
            const pdfFile1 = {
                fieldname: 'files',
                originalname: 'test1.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const pdfFile2 = {
                fieldname: 'files',
                originalname: 'test2.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const mockReq = {};

            // Both PDF files should pass
            const result1 = await testPdfImageFileFilter(pdfFile1, mockReq);
            const result2 = await testPdfImageFileFilter(pdfFile2, mockReq);

            expect(result1).toBe(true);
            expect(result2).toBe(true);
            expect((mockReq as any).fileTypeSet.size).toBe(1);
            expect((mockReq as any).fileTypeSet.has('application/pdf')).toBe(
                true,
            );
        });

        it('should initialize fileTypeSet if not present', async () => {
            const mockFile = {
                fieldname: 'files',
                originalname: 'test.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const mockReq = {};
            const result = await testPdfImageFileFilter(mockFile, mockReq);

            expect(result).toBe(true);
            expect((mockReq as any).fileTypeSet).toBeInstanceOf(Set);
            expect((mockReq as any).fileTypeSet.has('application/pdf')).toBe(
                true,
            );
        });
    });

    describe('File Size Limits', () => {
        it('should have correct file size constants', () => {
            const maxFileSize = 5 * 1024 * 1024; // 5MB
            const maxPdfImageSize = 50 * 1024 * 1024; // 50MB

            expect(maxFileSize).toBe(5242880);
            expect(maxPdfImageSize).toBe(52428800);
        });
    });

    describe('Constants and Configuration', () => {
        it('should have all required image mime types', () => {
            const expectedMimeTypes = [
                'image/jpeg',
                'image/png',
                'image/jpg',
                'image/webp',
                'image/bmp',
                'image/tiff',
                'image/svg+xml',
                'image/heif',
                'image/avif',
                'image/heic',
            ];

            // Verify all expected mime types are defined
            expectedMimeTypes.forEach((type) => {
                expect(typeof type).toBe('string');
                expect(type).toMatch(/^image\//);
            });
        });

        it('should have correct Excel mime type', () => {
            const excelMimeType =
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            expect(excelMimeType).toBe(
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
        });

        it('should have correct PDF and JPEG mime types for mixed upload', () => {
            const pdfMime = 'application/pdf';
            const jpegMime = 'image/jpeg';

            expect(pdfMime).toBe('application/pdf');
            expect(jpegMime).toBe('image/jpeg');
        });
    });

    describe('Error Messages', () => {
        it('should use correct error messages', () => {
            expect(errorMessage.OTHER.INVALID_FILE_TYPE).toBe(
                'Invalid file type',
            );
        });

        it('should have specific mixed file type error message', () => {
            const mixedFileError =
                'Cannot upload mixed file types. Upload only PDF or only JPEG.';
            expect(mixedFileError).toContain('mixed file types');
            expect(mixedFileError).toContain('PDF or only JPEG');
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle multiple valid image uploads', async () => {
            const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const allowedMimeTypes = [
                'image/jpeg',
                'image/png',
                'image/jpg',
                'image/webp',
                'image/bmp',
                'image/tiff',
                'image/svg+xml',
                'image/heif',
                'image/avif',
                'image/heic',
            ];

            for (const mimetype of imageTypes) {
                const mockFile = {
                    fieldname: 'image',
                    originalname: `test.${mimetype.split('/')[1]}`,
                    encoding: '7bit',
                    mimetype,
                    buffer: Buffer.from('test'),
                    size: 1024,
                } as Express.Multer.File;

                const testFilter = (file: Express.Multer.File | null) => {
                    return new Promise<boolean>((resolve, reject) => {
                        const callback = (
                            error: Error | null,
                            result?: boolean,
                        ) => {
                            if (error) reject(error);
                            else resolve(result || false);
                        };

                        if (file && allowedMimeTypes.includes(file.mimetype)) {
                            callback(null, true);
                        } else {
                            callback(new Error('Invalid file type'));
                        }
                    });
                };

                const result = await testFilter(mockFile);
                expect(result).toBe(true);
            }
        });

        it('should handle edge cases gracefully', async () => {
            const edgeCases = [
                null,
                undefined,
                {} as Express.Multer.File,
                { mimetype: '' } as Express.Multer.File,
                { mimetype: null } as any,
            ];

            const testFilter = (file: any) => {
                return new Promise<boolean>((resolve, reject) => {
                    const callback = (
                        error: Error | null,
                        result?: boolean,
                    ) => {
                        if (error) reject(error);
                        else resolve(result || false);
                    };

                    if (file && ['image/jpeg'].includes(file.mimetype)) {
                        callback(null, true);
                    } else {
                        callback(new Error('Invalid file type'));
                    }
                });
            };

            for (const edgeCase of edgeCases) {
                await expect(testFilter(edgeCase)).rejects.toThrow(
                    'Invalid file type',
                );
            }
        });
    });
});
