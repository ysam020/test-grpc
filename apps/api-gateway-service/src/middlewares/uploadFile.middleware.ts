import { errorMessage } from '@atc/common';
import multer from 'multer';

const storage = multer.memoryStorage();

const maxFileSize = 5 * 1024 * 1024;
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

const uploadFile = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
        if (file && allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(errorMessage.OTHER.INVALID_FILE_TYPE));
        }
    },
}).single('image');

const uploadExcelFile = multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
        if (
            file &&
            file.mimetype ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
            cb(null, true);
        } else {
            cb(new Error(errorMessage.OTHER.INVALID_FILE_TYPE));
        }
    },
}).single('file');

const uploadPdfOrImages = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const pdfMime = 'application/pdf';
        const jpegMimes = 'image/jpeg';
        const allAllowedMimes = [pdfMime, jpegMimes];

        if (!allAllowedMimes.includes(file.mimetype)) {
            return cb(new Error(errorMessage.OTHER.INVALID_FILE_TYPE));
        }

        const reqWithFileType = req as typeof req & {
            fileTypeSet: Set<string>;
        };

        if (!reqWithFileType.fileTypeSet) {
            reqWithFileType.fileTypeSet = new Set();
        }
        reqWithFileType.fileTypeSet.add(file.mimetype);

        if (reqWithFileType.fileTypeSet.size > 1) {
            return cb(
                new Error(
                    'Cannot upload mixed file types. Upload only PDF or only JPEG.',
                ),
            );
        }

        cb(null, true);
    },
}).array('files', 100);

export { uploadFile, uploadExcelFile, uploadPdfOrImages };
