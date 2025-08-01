import { imageScanWorker } from './imageScan.worker';
import { matchProductsWorker } from './matchProducts.worker';
import { processFilesWorker } from './processFiles.worker';
import { storeS3Worker } from './storeS3.worker';

export const startAllWorkers = () => {
    processFilesWorker();
    storeS3Worker();
    imageScanWorker();
    matchProductsWorker();
};
