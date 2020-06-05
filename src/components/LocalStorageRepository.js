export default class LocalStorageRepository {

    name;
    nullObject;
    nullObjectSupplier;
    subscribers = [];

    static builder() {
        return new Builder()
    }

    getLatest() {
        return JSON.parse(localStorage.getItem(this.name))
            || (this.nullObjectSupplier
                ? this.nullObjectSupplier()
                : this.nullObject);
    }

    save(data) {
        localStorage.setItem(this.name, JSON.stringify(data));
        this.subscribers.forEach(subscriber => subscriber(data))
    }

    subscribeOnChange(consumer) {
        if (this.subscribers.indexOf(consumer) === -1) {
            this.subscribers.push(consumer)
        }
    }
}

class Builder {
    name(name) {
        this._name = name;
        return this
    }

    nullObject(nullObject) {
        this._nullObject = nullObject;
        return this
    }

    nullObjectSupplier(nullObjectSupplier) {
        this._nullObjectSupplier = nullObjectSupplier;
        return this
    }

    subscribers(dataConsumers) {
        this._dataConsumers = dataConsumers;
        return this
    }

    build() {
        const repo = new LocalStorageRepository();
        repo.name = this._name;
        repo.nullObject = this._nullObject;
        repo.nullObjectSupplier = this._nullObjectSupplier;
        repo.subscribers.concat(this._dataConsumers);
        return repo
    }
}
