import LocalStorageRepository from "./LocalStorageRepository";

const historyRepository = LocalStorageRepository.builder()
    .name('history')
    .nullObjectSupplier(() => ({
        totalSeriesNamed: {},
        partialPerCurrencies: {},
    }))
    .build();

export default historyRepository
