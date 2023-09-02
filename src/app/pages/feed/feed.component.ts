import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  Firestore,
  collectionData,
  collection,
  getFirestore,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  limit,
  orderBy,
  addDoc,
} from '@angular/fire/firestore';
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
  styleUrls: ['./feed.component.scss'],
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
  today: Date = new Date();
  FeedStatus = FeedStatus;
  shareableURL: string = '';
  articleShareableURL: string = '';
  FeedPriority = FeedPriority;
  selectedChatMessage!: Message;
  activateArticleSharing: boolean = false;
  scrollAtTop: boolean = false;
  isLoadingNextPost: boolean = false;
  activeShareableType:
    | FeedType.ARTICLE
    | FeedType.FILE
    | FeedType.IMAGE
    | FeedType.TEXT = FeedType.TEXT;
  isSharePanelEnabled: boolean = false;
  isAllFilterPanelOpen: boolean = false;
  isLoadingPreviousPost: boolean = false;
  firestore: Firestore = inject(Firestore);
  isMultipleSelectionForFilter: boolean = false;
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  shareableContentType:
    | FeedType.ARTICLE
    | FeedType.FILE
    | FeedType.IMAGE
    | FeedType.TEXT = FeedType.TEXT;

  constructor(
    public globalService: GlobalService,
    public filterService: FiltersService,
    private ActivatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.globalService.showSpinner();
    this.ActivatedRoute.queryParams.subscribe((param) => {
      if (param.userId) {
        this.userId = param.userId;
      }
    });
    var date = new Date();
    var dateYesterday = new Date();
    this.filterService.validateAndLoadFiltersData();
    this.range.controls.end.setValue(date);
    dateYesterday.setDate(dateYesterday.getDate() - 6);
    this.range.controls.start.setValue(dateYesterday);
    this.initializeFilterForm();
    this.loadData();
    this.detectCollectionCountChanges();
    this.range.controls.end.valueChanges.subscribe((res) => {
      this.closeActiveConnection();
      this.loadData(res);
    });
  }

  scrollToElement(): void {
    setTimeout(() => {
      this.chatBoxContainer.nativeElement.scroll({
        top: this.chatBoxContainer.nativeElement.scrollHeight,
        left: 0,
        behavior: 'smooth',
      });
    }, 500);
  }

  isScrollNotAtBottom(): void {
    const container = this.chatBoxContainer.nativeElement;
    if (
      container.scrollTop + container.clientHeight <
      container.scrollHeight - 200
    ) {
      this.scrollAtTop = true;
    }
  }

  navigateToBottom(): void {
    this.scrollAtTop = false;
    this.initializeFilterForm();
    this.closeActiveConnection();
    this.loadData(new Date(), true);
  }

  detectCollectionCountChanges(): void {
    const itemCollection = collection(this.firestore, 'Feeds-Data');
    const q = query(
      itemCollection,
      where('postedOn', '<=', new Date()),
      where('postedOn', '>=', this.range.value.start)
    );
    const unsubscribe = onSnapshot(itemCollection, (querySnapshot) => {
      const collectionCount = querySnapshot.size;
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

  loadPreviousPost(): void {
    this.isLoadingPreviousPost = true;
    var previousDate: Date = this.range.controls.start.value!;
    previousDate.setDate(this.range.controls.start.value!.getDate() - 1);
    this.range.controls.start.setValue(previousDate);
  }

  loadNextPost(): void {
    this.isLoadingNextPost = true;
    var nextDate: Date = this.range.controls.end.value!;
    nextDate.setDate(this.range.controls.end.value!.getDate() + 1);
    this.range.controls.end.setValue(nextDate);
  }

  async loadData(endDate?: any, forceScroll?: boolean) {
    const itemCollection = collection(this.firestore, 'Feeds-Data');
    const q = query(itemCollection, ...this.generateDynamicQuery(endDate));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      this.messages = [];
      querySnapshot.forEach((doc) => {
        let message = {
          id: doc.id,
          ...doc.data(),
        };
        this.messages.push(message);
      });
      if (this.count == 0 || forceScroll) {
        this.scrollToElement();
      }
      this.isLoadingPreviousPost = false;
      ++this.count;
      this.globalService.hideSpinner();
    });
    this.unsubscribeFeed = unsubscribe;
  }

  generateDynamicQuery(endDate?: any) {
    let filterObject: any = this.filters.value;
    let combinedQuery: any = [
      where(
        'postedOn',
        '<=',
        endDate ? endDate : this.range.controls.end.value
      ),
      where('postedOn', '>=', this.range.value.start),
      orderBy('postedOn'),
    ];
    for (const property in filterObject) {
      if (this.isMultipleSelectionForFilter) {
        if (filterObject[property].length > 0) {
          let query = where(property, 'in', filterObject[property]);
          combinedQuery.push(query);
        }
      } else {
        if (filterObject[property]) {
          let query = where(property, '==', filterObject[property]);
          combinedQuery.push(query);
        }
      }
    }
    return combinedQuery;
  }

  onFilterChange(event: any, propertyName?: string): void {
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

  showShareOption(shareType: string): void {
    this.isSharePanelEnabled = true;
    this.activateArticleSharing = false;
    if (shareType == 'article') {
      this.activateArticleSharing = true;
    }
  }

  selectChatMessage(object: Message, articleShare?: boolean) {
    this.selectedChatMessage = object;
    if (articleShare)
      this.articleShareableURL = object.articleUrl ? object.articleUrl : '';
    switch (object.type) {
      case FeedType.ARTICLE:
        this.shareableContentType = FeedType.ARTICLE;
        this.shareableURL = object.articleUrl ? object.articleUrl : '';
        break;
      case FeedType.FILE:
        this.shareableContentType = FeedType.FILE;
        this.shareableURL = object.fileUrl ? object.fileUrl : '';
        break;
      case FeedType.IMAGE:
        this.shareableContentType = FeedType.IMAGE;
        this.shareableURL = object.imageUrl ? object.imageUrl : '';
        break;
      default:
        this.shareableContentType = FeedType.TEXT;
        this.shareableURL = object.messageContent
          ? this.removeTags(object.messageContent)
          : '';
        break;
    }
  }

  switchFilterMode(event: any) {
    this.isAllFilterPanelOpen = false;
    setTimeout(() => {
      this.isMultipleSelectionForFilter = !this.isMultipleSelectionForFilter;
      this.initializeFilterForm();
      this.isAllFilterPanelOpen = true;
    }, 200);
  }

  applyAllFilter(): void {
    this.globalService.showSpinner();
    this.isAllFilterPanelOpen = false;
    this.closeActiveConnection();
    this.loadData();
  }

  closeActiveConnection(): void {
    if (this.unsubscribeFeed) {
      this.unsubscribeFeed();
    }
  }

  initializeFilterForm(): void {
    if (this.isMultipleSelectionForFilter) {
      this.filters = new FormGroup({
        commodity: new FormControl([]),
        subCommodity: new FormControl([]),
        sourceType: new FormControl([]),
        region: new FormControl([]),
        feedTopic: new FormControl([]),
      });
    } else {
      this.filters = new FormGroup({
        commodity: new FormControl(null),
        subCommodity: new FormControl(null),
        sourceType: new FormControl(null),
        region: new FormControl(null),
        feedTopic: new FormControl(null),
      });
    }
  }

  openURLInNewTab(url: string) {
    if (url) {
      window.open(url, '_blank');
    } else {
      console.log('Resource URL Missing !');
    }
  }

  addData(): void {
    const db = getFirestore();
    const dbRef = collection(db, 'Feeds-Data');
    let data = {
      isShareable: true,
      status: 'Published',
      priority: 'Low',
      postedBy: 'Farhan',
      postedOn: new Date(),
      imageUrl: '',
      bookmarkTracking: [],
      fileThumbnailImageUrl: '',
      messageContent:
        'Question for tech enthusiasts: With AI evolving rapidly, how do you envision its impact on job roles across industries? Looking forward to insightful discussions.',
      articleUrl: 'https://www.britannica.com/science/crude-oil',
      sourceType: 'Primary',
      sourceValue: 'DPID-12346',
      isBookmarked: true,
      fileUrl: '',
      type: 'Text',
      commodity: 'Commodity 1',
      subCommodity: 'Sub Commodity 2',
      feedTopic: 'Technology',
      region: 'USA',
    };
    addDoc(dbRef, data)
      .then((docRef) => {})
      .catch((error) => {
        console.log(error);
      });
  }

  addDataFile(): void {
    const db = getFirestore();
    const dbRef = collection(db, 'Feeds-Data');
    let data = {
      isShareable: true,
      status: 'Verified',
      priority: 'Medium',
      postedBy: 'John',
      postedOn: new Date(),
      imageUrl: '',
      bookmarkTracking: [],
      fileThumbnailImageUrl:
        'https://cdn.news.alphastreet.com/wp-content/uploads/2023/08/Apple-Q3-2023-earnings-infographic.jpg',
      messageContent:
        '<h2>Apple Stocks Decline</h2><br />Gadget giant Apple Inc. (NASDAQ: AAPL) on Thursday said its third-quarter 2023 sales declined modestly from last year. The results came in above the market’s projections.',
      articleUrl: '',
      sourceType: 'Secondary',
      sourceValue: 'Financial',
      isBookmarked: true,
      fileUrl:
        'https://www.apple.com/newsroom/pdfs/FY23_Q1_Consolidated_Financial_Statements.pdf',
      type: 'File',
      commodity: 'Commodity 1',
      subCommodity: 'Sub Commodity 2',
      feedTopic: 'Technology',
      region: 'UK',
    };
    addDoc(dbRef, data)
      .then((docRef) => {})
      .catch((error) => {
        console.log(error);
      });
  }

  addDataImage(): void {
    const db = getFirestore();
    const dbRef = collection(db, 'Feeds-Data');
    let data = {
      isShareable: true,
      status: 'Rejected',
      priority: 'High',
      postedBy: 'Allan',
      postedOn: new Date(),
      imageUrl:
        'https://images.cointelegraph.com/images/717_aHR0cHM6Ly9zMy5jb2ludGVsZWdyYXBoLmNvbS91cGxvYWRzLzIwMjMtMDgvNGUxNTk0ZTYtOTNmZi00OTk2LTkxOGUtMTc4NzQ3MmY3MmI2LmpwZw==.jpg',
      bookmarkTracking: [],
      fileThumbnailImageUrl: '',
      messageContent:
        '<h2>Why the choice of the blockchain matters for NFT collections ?</h2><br />When choosing a blockchain, consider the trade-offs and align it with your needs. Avoid risking your funds, time and community trust.',
      articleUrl:
        'https://cointelegraph.com/innovation-circle/why-the-choice-of-the-blockchain-matters-for-nft-collections',
      sourceType: 'Secondary',
      sourceValue: 'Business Times',
      isBookmarked: true,
      fileUrl: '',
      type: 'Image',
      commodity: 'Commodity 1',
      subCommodity: 'Sub Commodity 2',
      feedTopic: 'Technology',
      region: 'India',
    };
    addDoc(dbRef, data)
      .then((docRef) => {})
      .catch((error) => {
        console.log(error);
      });
  }

  isPostBookmarked(message: Message): boolean {
    if (this.userId) {
      return message.bookmarkTracking?.find((x: string) => x == this.userId)
        ? true
        : false;
    }
    return false;
  }

  bookmarkPost(message: Message): void {
    const db = getFirestore();
    const docRef = doc(db, 'Feeds-Data', message.id);
    let data;
    if (this.userId) {
      if (message.bookmarkTracking?.find((x: string) => x == this.userId)) {
        data = {
          bookmarkTracking: message.bookmarkTracking.filter(
            (x: string) => x != this.userId
          ),
        };
      } else {
        data = {
          bookmarkTracking: [this.userId, ...message.bookmarkTracking!],
        };
      }
      updateDoc(docRef, data)
        .then((docRef) => {})
        .catch((error) => {
          console.log(error);
        });
    }
  }

  removeTags(str: string): string {
    if (str === null || str === '') return '';
    else str = str.toString();
    return str.replace(/(<([^>]+)>)/gi, '');
  }
}
