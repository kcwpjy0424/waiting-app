importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA1Yvnrp5aLoMkYsDK5luVByDVXnqTLi3E",
  authDomain: "qr-code-waiting.firebaseapp.com",
  projectId: "qr-code-waiting",
  storageBucket: "qr-code-waiting.firebasestorage.app",
  messagingSenderId: "464431670960",
  appId: "1:464431670960:web:2aaf2f8fb5b3e7ac107d75"
});

const messaging = firebase.messaging();

// 백그라운드 알림 처리
messaging.onBackgroundMessage((payload) => {
  console.log("백그라운드 알림 수신:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});