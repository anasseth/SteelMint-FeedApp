import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {

    public storageKeys: string[] = ['collectionVersion','commodity', 'subCommodity', 'sourceType', 'region', 'feedTopics'];

    constructor() { };

    saveItem(key: string, dataSet: string[] | string): void {
        localStorage.setItem(key, JSON.stringify(dataSet));
    }

    retrieveItem(key: string) {
        let dataSet: any = localStorage.getItem(key);
        if (dataSet) {
            return JSON.parse(dataSet)
        }
        else {
            return null;
        }
    }

}
