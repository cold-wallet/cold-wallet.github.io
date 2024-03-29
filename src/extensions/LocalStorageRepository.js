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

    exist() {
        return !!localStorage.getItem(this.name);
    }

    save(data) {
        const newData = JSON.stringify(data);
        const oldData = localStorage.getItem(this.name) || "{}";
        if (newData === oldData) {
            return
        }
        localStorage.setItem(this.name, newData);
        this.subscribers.forEach(subscriber => {
            try {
                subscriber(data)
            } catch (e) {
                console.error(e)
            }
        })
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

    subscribers(subscribers) {
        this._subscribers = subscribers;
        return this
    }

    build() {
        const repo = new LocalStorageRepository();
        repo.name = this._name;
        repo.nullObject = this._nullObject;
        repo.nullObjectSupplier = this._nullObjectSupplier;
        repo.subscribers = this._subscribers || [];
        return repo
    }
}
