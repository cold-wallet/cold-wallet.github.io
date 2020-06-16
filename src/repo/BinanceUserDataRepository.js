import LocalStorageRepository from "./LocalStorageRepository";

const binanceUserDataRepository = LocalStorageRepository.builder()
    .name('binance-user-data')
    .nullObject({})
    .build();

export default binanceUserDataRepository
