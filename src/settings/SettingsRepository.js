import LocalStorageRepository from "../extensions/LocalStorageRepository";

const settingsRepository = LocalStorageRepository.builder()
    .name('settings')
    .nullObject({
        integrations: {
            monobank: {
                monobankIntegrationEnabled: false,
                monobankIntegrationToken: "",
            },
        },
    })
    .build();

export default settingsRepository
