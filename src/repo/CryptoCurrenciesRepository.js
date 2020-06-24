import LocalStorageRepository from "./LocalStorageRepository";

const cryptoCurrenciesRepository = LocalStorageRepository.builder()
    .name('cryptoCurrencies')
    .nullObject([])
    .build();

export default cryptoCurrenciesRepository
