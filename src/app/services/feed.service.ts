// import { Injectable } from '@angular/core';
// import { Firestore } from '@angular/fire/firestore';
// // import { Message } from '../models/Feeds';
// import { FireDatabase, FireList } from '@angular/fire';

// @Injectable({
//   providedIn: 'root'
// })
// export class FeedService {

//   constructor(private firestore: Firestore) { }

//   createFoodItem(data: any) {
//     return new Promise<any>((resolve, reject) => {
//       this.firestore
//         .collection("New-Food-Post")
//         .add(data)
//         .then((res: any) => { }, (err: any) => reject(err));
//     });
//   }

//   deleteFoodItem(id: any) {
//     return new Promise<any>((resolve, reject) => {
//       this.firestore
//         .collection("New-Food-Post")
//         .doc(id)
//         .delete()
//         .then((res: any) => {
//           // this.snackbar.open(
//           //   "Erfolgreich löschen !",
//           //   'Close',
//           //   { duration: 4000 })
//         }, (err: any) => {
//           // this.snackbar.open(
//           //   "Löschen fehlgeschlagen !",
//           //   'Close',
//           //   { duration: 4000 })
//           reject(err)
//         });
//     });
//   }

//   getAllFoodItem() {
//     return this.firestore.collection("New-Food-Post").snapshotChanges();
//   }

// }
