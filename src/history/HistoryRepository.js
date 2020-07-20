import LocalStorageRepository from "../extensions/LocalStorageRepository";

const historyRepository = LocalStorageRepository.builder()
    .name('history')
    .nullObjectSupplier(() => ({
        totalSeriesNamed: {},
        partialPerCurrencies: {},
    }))
    .build();

export default historyRepository
