import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { LocalStorageService } from './localstorage.service';

@Injectable({
    providedIn: 'root'
})
export class FiltersService {

    collectionVersion: string = '';
    commodityList: string[] = [];
    subCommodityList: string[] = [];
    sourceTypeList: string[] = [];
    regionList: string[] = [];
    feedTopicList: string[] = [];

    constructor(private firestore: Firestore, public localStorageService: LocalStorageService) { }

    validateAndLoadFiltersData(){
        this.getCollectionVersion();
    }

    loadFiltersData(forceRefresh: boolean) {
        this.getCommodity(forceRefresh);
        this.getSubCommodity(forceRefresh);
        this.getSourceType(forceRefresh);
        this.getRegionList(forceRefresh);
        this.getFeedTopics(forceRefresh);
    }

    getCollectionVersion() {
        let collectionVersionStored = this.localStorageService.retrieveItem(this.localStorageService.storageKeys[0]);
        const itemCollection = collection(this.firestore, 'Collection-Version');
        let collectionVersion$ = collectionData(itemCollection);
        collectionVersion$.subscribe(
            (version) => {
                if (collectionVersionStored && version[0].collectionVersion == collectionVersionStored) {
                    this.loadFiltersData(false);
                }
                else {
                    this.localStorageService.saveItem(this.localStorageService.storageKeys[0], version[0].collectionVersion);
                    this.collectionVersion = version[0].collectionVersion;
                    this.loadFiltersData(true);
                }
            }
        )
    }

    getCommodity(forceRefresh: boolean) {
        let commodityListStored = this.localStorageService.retrieveItem(this.localStorageService.storageKeys[1]);
        if (commodityListStored && !forceRefresh) {
            this.commodityList = commodityListStored;
        }
        else {
            const itemCollection = collection(this.firestore, 'Commodity');
            let commodity$ = collectionData(itemCollection);
            commodity$.subscribe(
                (commodityList) => {
                    this.commodityList = commodityList.map(x => x.name);
                    this.localStorageService.saveItem(this.localStorageService.storageKeys[1], this.commodityList);
                }
            )
        }
    }

    getSubCommodity(forceRefresh: boolean) {
        let subCommodityListStored = this.localStorageService.retrieveItem(this.localStorageService.storageKeys[2]);
        if (subCommodityListStored && !forceRefresh) {
            this.subCommodityList = subCommodityListStored;
        }
        else {
            const itemCollection = collection(this.firestore, 'Sub-Commodity');
            let subCommodity$ = collectionData(itemCollection);
            subCommodity$.subscribe(
                (subCommodity) => {
                    this.subCommodityList = subCommodity.map(x => x.name);
                    this.localStorageService.saveItem(this.localStorageService.storageKeys[2], this.subCommodityList);
                }
            )
        }
    }

    getSourceType(forceRefresh: boolean) {
        let sourceTypeListStored = this.localStorageService.retrieveItem(this.localStorageService.storageKeys[3]);
        if (sourceTypeListStored && !forceRefresh) {
            this.sourceTypeList = sourceTypeListStored;
        }
        else {
            const itemCollection = collection(this.firestore, 'Source Type');
            let sourceType$ = collectionData(itemCollection);
            sourceType$.subscribe(
                (sourceType) => {
                    this.sourceTypeList = sourceType.map(x => x.name);
                    this.localStorageService.saveItem(this.localStorageService.storageKeys[3], this.sourceTypeList);
                }
            )
        }
    }

    getRegionList(forceRefresh: boolean) {
        let regionListStored = this.localStorageService.retrieveItem(this.localStorageService.storageKeys[4]);
        if (regionListStored && !forceRefresh) {
            this.regionList = regionListStored;
        }
        else {
            const itemCollection = collection(this.firestore, 'Region-List');
            let regionList$ = collectionData(itemCollection);
            regionList$.subscribe(
                (regionList) => {
                    this.regionList = regionList.map(x => x.name);
                    this.localStorageService.saveItem(this.localStorageService.storageKeys[4], this.regionList);
                }
            )
        }
    }

    getFeedTopics(forceRefresh: boolean) {
        let feedTopicListStored = this.localStorageService.retrieveItem(this.localStorageService.storageKeys[5]);
        if (feedTopicListStored && !forceRefresh) {
            this.feedTopicList = feedTopicListStored;
        }
        else {
            const itemCollection = collection(this.firestore, 'Feed-Topics');
            let feedTopics$ = collectionData(itemCollection);
            feedTopics$.subscribe(
                (feedTopic) => {
                    this.feedTopicList = feedTopic.map(x => x.name);
                    this.localStorageService.saveItem(this.localStorageService.storageKeys[5], this.feedTopicList);
                }
            )
        }
    }

}
