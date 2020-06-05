import LocalStorageRepository from "./LocalStorageRepository";

const assetsRepository = LocalStorageRepository.builder()
    .name('data')
    .nullObject({
        assets: {
            cash: {
                type: 'cash',
                assets: [],
            },
            "non-cash": {
                type: 'non-cash',
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
