import LocalStorageRepository from "./LocalStorageRepository";

const fiatRatesRepository = LocalStorageRepository.builder()
    .name('rates')
    .nullObject([])
    .build();

export default fiatRatesRepository
