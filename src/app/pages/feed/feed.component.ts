import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Firestore, collectionData, collection, getFirestore, doc, updateDoc, query, where, onSnapshot, limit, orderBy, addDoc } from '@angular/fire/firestore';
import { Observable, Subject } from 'rxjs';
import { FeedStatus } from 'src/app/models/FeedStatus';
import { FeedPriority } from 'src/app/models/FeedPriority';
import { FeedType } from 'src/app/models/FeedType';
import { GlobalService } from 'src/app/services/global.service';
import { Message } from 'src/app/models/Feeds';
import { FormGroup, FormControl } from '@angular/forms';
import { FiltersService } from 'src/app/services/filters.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  @ViewChild('chatbox') private chatBoxContainer!: ElementRef;
  feeds$!: Observable<any[]>;
  test$: any;
  feedUpdated: Subject<boolean> = new Subject();
  userId!: string;
  unsubscribeFeed!: any;
  count: number = 0;
  messages: any = [];
  FeedType = FeedType;
  filters!: FormGroup;
  today: Date = new Date;
  FeedStatus = FeedStatus;
  shareableURL: string = '';
  FeedPriority = FeedPriority;
  selectedChatMessage!: Message;
  scrollAtTop: boolean = false;
  isLoadingNextPost: boolean = false;
  isSharePanelEnabled: boolean = false;
  isAllFilterPanelOpen: boolean = false;
  isLoadingPreviousPost: boolean = false;
  firestore: Firestore = inject(Firestore);
  isMultipleSelectionForFilter: boolean = false;
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  shareableContentType: FeedType.ARTICLE | FeedType.FILE | FeedType.IMAGE | FeedType.TEXT = FeedType.TEXT;

  constructor(public globalService: GlobalService, public filterService: FiltersService, private ActivatedRoute: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.ActivatedRoute.queryParams.subscribe(
      (param) => {
        if (param.userId) {
          this.userId = param.userId;
        }
      }
    )
    var date = new Date();
    var dateYesterday = new Date();
    this.filterService.validateAndLoadFiltersData();
    this.range.controls.end.setValue(date);
    dateYesterday.setDate(dateYesterday.getDate() - 18);
    this.range.controls.start.setValue(dateYesterday);
    this.initializeFilterForm();
    this.loadData();
    this.detectCollectionCountChanges();
    this.range.controls.end.valueChanges.subscribe(
      (res) => {
        this.closeActiveConnection();
        this.loadData(res);
      }
    )
  }

  scrollToElement(): void {
    setTimeout(() => {
      this.chatBoxContainer.nativeElement.scroll({
        top: this.chatBoxContainer.nativeElement.scrollHeight,
        left: 0,
        behavior: 'smooth'
      });
    }, 500);
  }

  isScrollNotAtBottom(): void {
    const container = this.chatBoxContainer.nativeElement;
    if(container.scrollTop + container.clientHeight < container.scrollHeight - 200){
      this.scrollAtTop = true;
    }
  }

  navigateToBottom(){
    this.scrollAtTop = false;
    this.initializeFilterForm();
    this.closeActiveConnection();
    this.loadData(new Date(), true);
  }

  detectCollectionCountChanges() {
    const itemCollection = collection(this.firestore, 'Feeds-Data');
    const q = query(itemCollection, where("postedOn", "<=", new Date()), where("postedOn", ">=", this.range.value.start))
    const unsubscribe = onSnapshot(itemCollection, (querySnapshot) => {
      const collectionCount = querySnapshot.size;
      console.log("Collection Count : ", collectionCount)
      this.count++;
      if (this.unsubscribeFeed) {
        this.unsubscribeFeed();
        if (this.count > 2) {
          this.isScrollNotAtBottom();
          this.loadData(new Date());
        }
      }
    });
  }

  loadPreviousPost() {
    this.isLoadingPreviousPost = true;
    var previousDate: Date = this.range.controls.start.value!;
    previousDate.setDate(this.range.controls.start.value!.getDate() - 1);
    this.range.controls.start.setValue(previousDate);
  }

  loadNextPost() {
    this.isLoadingNextPost = true;
    var nextDate: Date = this.range.controls.end.value!;
    nextDate.setDate(this.range.controls.end.value!.getDate() + 1);
    this.range.controls.end.setValue(nextDate);
  }

  async loadData(endDate?: any, forceScroll?:boolean) {
    const itemCollection = collection(this.firestore, 'Feeds-Data');
    const q = query(itemCollection, ...this.generateDynamicQuery(endDate));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      this.messages = [];
      querySnapshot.forEach((doc) => {
        let message = {
          id: doc.id,
          ...doc.data()
        }
        this.messages.push(message)
      });
      if (this.count == 0 || forceScroll) {
        this.scrollToElement();
      }
      this.isLoadingPreviousPost = false;
      ++this.count;
      console.log("Messages : ", this.messages)
    });
    this.unsubscribeFeed = unsubscribe;
  }

  generateDynamicQuery(endDate?: any) {
    let filterObject: any = this.filters.value;
    let combinedQuery: any = [where("postedOn", "<=", endDate ? endDate : this.range.controls.end.value), where("postedOn", ">=", this.range.value.start), orderBy("postedOn")];
    for (const property in filterObject) {
      if (this.isMultipleSelectionForFilter) {
        if (filterObject[property].length > 0) {
          let query = where(property, 'in', filterObject[property]);
          combinedQuery.push(query);
        }
      }
      else {
        if (filterObject[property]) {
          let query = where(property, '==', filterObject[property]);
          combinedQuery.push(query);
        }
      }
    }
    return combinedQuery;
  }

  onFilterChange(event: any, propertyName?: string) {
    if (this.isMultipleSelectionForFilter) {
      let filterObject: any = this.filters.value;
      for (const property in filterObject) {
        if (filterObject[property].length > 0) {
          if (property != propertyName) {
            this.filters.get(property)!.setValue([]);
          }
        }
      }
    }
  }

  showShareOption() {
    this.isSharePanelEnabled = true;
  }

  selectChatMessage(object: Message) {
    this.selectedChatMessage = object;
    switch (object.type) {
      case FeedType.ARTICLE:
        this.shareableContentType = FeedType.ARTICLE;
        this.shareableURL = object.articleUrl ? object.articleUrl : ''
        break;
      case FeedType.FILE:
        this.shareableContentType = FeedType.FILE;
        this.shareableURL = object.fileUrl ? object.fileUrl : ''
        break;
      case FeedType.IMAGE:
        this.shareableContentType = FeedType.IMAGE;
        this.shareableURL = object.imageUrl ? object.imageUrl : ''
        break;
      default:
        this.shareableContentType = FeedType.TEXT;
        this.shareableURL = object.messageContent ? object.messageContent : ''
        break;
    }
  }

  switchFilterMode(event: any) {
    this.isAllFilterPanelOpen = false;
    setTimeout(() => {
      this.isMultipleSelectionForFilter = !this.isMultipleSelectionForFilter
      this.initializeFilterForm();
      this.isAllFilterPanelOpen = true;
    }, 200);
  }

  applyAllFilter() {
    this.isAllFilterPanelOpen = false;
    this.closeActiveConnection();
    this.loadData();
  }

  closeActiveConnection() {
    if (this.unsubscribeFeed) {
      this.unsubscribeFeed();
    }
  }

  initializeFilterForm() {
    if (this.isMultipleSelectionForFilter) {
      this.filters = new FormGroup({
        commodity: new FormControl([]),
        subCommodity: new FormControl([]),
        sourceType: new FormControl([]),
        region: new FormControl([]),
        feedTopic: new FormControl([]),
      })
    }
    else {
      this.filters = new FormGroup({
        commodity: new FormControl(null),
        subCommodity: new FormControl(null),
        sourceType: new FormControl(null),
        region: new FormControl(null),
        feedTopic: new FormControl(null),
      })
    }
  }

  openURLInNewTab(url: string) {
    if (url) {
      window.open(url, "_blank");
    }
    else {
      console.log("Resource URL Missing !")
    }
  }

  addData() {
    const db = getFirestore();
    const dbRef = collection(db, "Feeds-Data");
    let data = {
      "isShareable": true,
      "status": "Verified",
      "priority": "High",
      "feedType": "Primary",
      "postedBy": "Farhan",
      "postedOn": new Date(),
      "imageUrl": "",
      "bookmarkTracking": [],
      "fileThumbnailImageUrl": "",
      "messageContent": "Question for tech enthusiasts: With AI evolving rapidly, how do you envision its impact on job roles across industries? Looking forward to insightful discussions.",
      "articleUrl": "",
      "sourceType": "Discussion",
      "isBookmarked": true,
      "fileUrl": "",
      "category": "Artificial Intelligence",
      "type": "Text",
      commodity: 'Commodity 1',
      subCommodity: 'Sub Commodity 2',
      feedTopic: 'Technology',
      region: 'USA',
    }
    addDoc(dbRef, data)
      .then(docRef => {
        console.log("Document has been added successfully");
      })
      .catch(error => {
        console.log(error);
      })
  }

  isPostBookmarked(message: Message) {
    if (this.userId) {
      return message.bookmarkTracking?.find((x: string) => x == this.userId) ? true : false;
    }
    return false;
  }

  bookmarkPost(message: Message) {
    const db = getFirestore();
    const docRef = doc(db, "Feeds-Data", message.id);
    let data;
    if (this.userId) {
      if (message.bookmarkTracking?.find((x: string) => x == this.userId)) {
        data = {
          bookmarkTracking: message.bookmarkTracking.filter((x: string) => x != this.userId),
        };
      }
      else {
        data = {
          bookmarkTracking: [this.userId, ...message.bookmarkTracking!],
        };
      }
      updateDoc(docRef, data)
        .then(docRef => {
          console.log("Message Bookmarked !");
        })
        .catch(error => {
          console.log(error);
        })
    }
  }

  public get startDate() {
    return this.range.controls.start.value;
  }

  public get endDate() {
    return this.range.controls.end.value;
  }
}