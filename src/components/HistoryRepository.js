import LocalStorageRepository from "./LocalStorageRepository";
import assetsRepository from "./assetsRepository";

const historyRepository = LocalStorageRepository.builder()
    .name('history')
    .nullObjectSupplier(() => ({
        series: [],
        named: {},
        assets: assetsRepository.getLatest(),
    }))
    .build();

export default historyRepository
