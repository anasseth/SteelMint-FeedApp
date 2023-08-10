import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Firestore, collectionData, collection, getFirestore, doc, updateDoc, getDocs, query, where, onSnapshot, limit, orderBy, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FeedStatus } from 'src/app/models/FeedStatus';
import { FeedPriority } from 'src/app/models/FeedPriority';
import { FeedType } from 'src/app/models/FeedType';
import { GlobalService } from 'src/app/services/global.service';
import { Message } from 'src/app/models/Feeds';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.scss']
})
export class FeedComponent implements OnInit {
  @ViewChild('chatbox') private chatBoxContainer!: ElementRef;
  feeds$!: Observable<any[]>;
  test$: any;
  firestore: Firestore = inject(Firestore);
  messages: any = [];
  shareableURL: string = '';
  shareableContentType: FeedType.ARTICLE | FeedType.FILE | FeedType.IMAGE | FeedType.TEXT = FeedType.TEXT;
  selectedChatMessage!: Message;
  FeedStatus = FeedStatus;
  FeedPriority = FeedPriority;
  FeedType = FeedType;
  isLoadingPreviousPost: boolean = false;
  isSharePanelEnabled: boolean = false;
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor(public globalService: GlobalService) { }

  scrollToElement(): void {
    setTimeout(() => {
      this.chatBoxContainer.nativeElement.scroll({
        top: this.chatBoxContainer.nativeElement.scrollHeight,
        left: 0,
        behavior: 'smooth'
      });
    }, 500);
  }

  ngOnInit(): void {
    // Setting Default Date Range to Last One Day
    var date = new Date();
    var dateYesterday = new Date();
    this.range.controls.end.setValue(date);
    dateYesterday.setDate(dateYesterday.getDate() - 1);
    this.range.controls.start.setValue(dateYesterday);
    // Calling Data Load API;
    this.loadData();
    // Subscribing to Date Change
    this.range.controls.end.valueChanges.subscribe(
      (res) => {
        this.loadData(res)
      }
    )
  }

  loadPreviousPost() {
    this.isLoadingPreviousPost = true;
    var previousDate: Date = this.range.controls.start.value!;
    previousDate.setDate(this.range.controls.start.value!.getDate() - 1);
    this.range.controls.start.setValue(previousDate);
  }

  async loadData(endDate?: any) {
    const itemCollection = collection(this.firestore, 'Feeds-Data');
    const q = query(itemCollection, where("postedOn", "<=", endDate ? endDate : this.range.controls.end.value), where("postedOn", ">=", this.range.value.start), orderBy("postedOn"), limit(10));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      this.messages = [];
      querySnapshot.forEach((doc) => {
        let message = {
          id: doc.id,
          ...doc.data()
        }
        this.messages.push(message)
      });
      this.isLoadingPreviousPost = false;
      console.log("Messages : ", this.messages)
      this.scrollToElement();
    });
    // this.addData();
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
      "backgroundColor": "#42f59b",
      "postedBy": "Hamza",
      "postedOn": new Date(),
      "imageUrl": "",
      "fileThumbnailImageUrl": "https://www.perlego.com/books/RM_Books/kaplan_wcyricq/9781638356431.jpg",
      "messageContent":
        "Flutter, a revolutionary new cross-platform software development kit created by Google, makes it easier than ever to write secure, high-performance native apps for iOS and Android. Flutter apps are blazingly fast because this open source solution compiles your Dart code to platform-specific programs with no JavaScript bridge! Flutter also supports hot reloading to update changes instantly. And thanks to its built-in widgets and rich motion APIs, Flutter's apps are not just highly responsive, they're stunning!Purchase of the print book includes a free eBook in PDF, Kindle, and ePub formats from Manning Publications.About the technologyWith Flutter, you can build mobile applications using a single, feature-rich SDK that includes everything from a rendering engine to a testing environment. Flutter compiles programs written in Google's intuitive Dart language to platform-specific code so your iOS and Android games, utilities, and shopping platforms all run like native Java or Swift apps.About the book Flutter in Action teaches you to build professional-quality mobile applications using the Flutter SDK and the Dart programming language. You'll begin with a quick tour of Dart essentials and then dive into engaging, well-described techniques for building beautiful user interfaces using Flutter's huge collection of built-in widgets. The combination of diagrams, code examples, and annotations makes learning a snap.",
      "articleUrl": "",
      "source": "Third Party",
      "isBookmarked": false,
      "fileUrl": "https://edu.anarcho-copy.org/Programming%20Languages/Frontend/flutter/Flutter%20in%20Action.pdf",
      "category": "Commodity",
      "type": "File"
    }
    addDoc(dbRef, data)
      .then(docRef => {
        console.log("Document has been added successfully");
      })
      .catch(error => {
        console.log(error);
      })
  }

  bookmarkPost(message: Message) {
    const db = getFirestore();
    const docRef = doc(db, "Feeds-Data", message.id);
    const data = {
      isBookmarked: message.isBookmarked ? false : true,
    };
    updateDoc(docRef, data)
      .then(docRef => {
        console.log("Message Bookmarked !");
      })
      .catch(error => {
        console.log(error);
      })
  }
}



// 
    // // const itemCollection = collection(this.firestore, 'Feeds-Data');
    // // this.feeds$ = collectionData(itemCollection);
    // // this.feeds$.subscribe(
    // //   (messages) => {
    // //     console.log("Messages : ", JSON.stringify(messages, undefined, 3))
    // //     this.messages = messages.reverse();
    // //   }
    // // )
    // this.loadData();