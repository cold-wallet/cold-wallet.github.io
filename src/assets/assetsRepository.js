import LocalStorageRepository from "../repo/LocalStorageRepository";

const assetsRepository = LocalStorageRepository.builder()
    .name('data')
    .nullObject({
        assets: {
            fiat: {
                type: 'fiat',
                assets: [],
            },
            crypto: {
                type: 'crypto',
                assets: [],
            },
        },
    })
    .build();

export default assetsRepository
