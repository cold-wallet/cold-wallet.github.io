import LocalStorageRepository from "../repo/LocalStorageRepository";

const historyRepository = LocalStorageRepository.builder()
    .name('history')
    .nullObjectSupplier(() => ({
        totalSeriesNamed: {},
        partialPerCurrencies: {},
    }))
    .build();

export default historyRepository
