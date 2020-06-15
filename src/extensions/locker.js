import LocalStorageRepository from "../repo/LocalStorageRepository";

const lockerRepository = LocalStorageRepository.builder()
    .name('locker')
    .nullObject({})
    .build();

export default lockerRepository
