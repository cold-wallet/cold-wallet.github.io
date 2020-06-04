import historyService from "./historyService";

const dataStoreName = 'data';

export default {
    getLatest() {
        return JSON.parse(localStorage.getItem(dataStoreName)) || {};
    },

    save(data) {
        localStorage.setItem(dataStoreName, JSON.stringify(data));
        historyService.updateHistory(data);
    }
}
