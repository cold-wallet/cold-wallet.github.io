import LocalStorageRepository from "./LocalStorageRepository";

const monobankUserDataRepository = LocalStorageRepository.builder()
    .name('monobank-user-data')
    .nullObject({
        name: null,
        accounts: null,
    })
    .build();

export default monobankUserDataRepository
