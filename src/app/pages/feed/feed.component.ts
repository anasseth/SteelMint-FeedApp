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
  selectedChatMessage!: Message;
  FeedStatus = FeedStatus;
  FeedPriority = FeedPriority;
  FeedType = FeedType;
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
        this.shareableURL = object.articleUrl ? object.articleUrl : ''
        break;
      case FeedType.FILE:
        this.shareableURL = object.fileUrl ? object.fileUrl : ''
        break;
      case FeedType.IMAGE:
        this.shareableURL = object.imageUrl ? object.imageUrl : ''
        break;
      default:
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
      "status": "Published",
      "priority": "Low",
      "feedType": "Primary",
      "backgroundColor": "#42f59b",
      "postedBy": "Millsoft",
      "postedOn": new Date(),
      "imageUrl": "",
      "fileThumbnailImageUrl": "",
      "messageContent":
        "The lifecycle of crude oil encompasses a multifaceted process that spans extraction to consumption. Drilling rigs delve into the Earth's depths to extract the oil, which is then transported via pipelines, ships, and trucks to refineries. At these refineries, it undergoes intricate processes to yield refined products such as gasoline, diesel, and petrochemical feedstocks. As society seeks greener alternatives, the lifecycle of crude oil prompts us to evaluate energy transitions, waste management, and the quest for more sustainable solutions.",
      "articleUrl": "",
      "source": "Third Party",
      "isBookmarked": false,
      "fileUrl": "",
      "category": "Commodity",
      "type": "Text"
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