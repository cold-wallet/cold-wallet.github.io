import LocalStorageRepository from "./LocalStorageRepository";

const historyRepository = LocalStorageRepository.builder()
    .name('history')
    .nullObjectSupplier(() => ({
        series: [],
        totalSeries: [],
        totalSeriesNamed: {},
        named: {},
    }))
    .build();

export default historyRepository
