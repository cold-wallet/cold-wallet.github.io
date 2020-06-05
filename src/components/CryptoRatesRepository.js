import LocalStorageRepository from "./LocalStorageRepository";

const cryptoRatesRepository = LocalStorageRepository.builder()
    .name('cryptoRates')
    .nullObject([])
    .build();

export default cryptoRatesRepository
