import LocalStorageRepository from "../../extensions/LocalStorageRepository";

const binanceUserDataRepository = LocalStorageRepository.builder()
    .name('binance-user-data')
    .nullObject({})
    .build();

export default binanceUserDataRepository
