const firebase = require('firebase');

module.exports = () => {
  firebase.initializeApp({
    apiKey: 'AIzaSyDDe8P0yyyOsI-pa4AKPoS8SZMpqKbtOEw',
    authDomain: 'wwcd-f0480.firebaseapp.com',
    databaseURL: 'https://wwcd-f0480.firebaseio.com',
    projectId: 'wwcd-f0480',
    storageBucket: 'wwcd-f0480.appspot.com',
    messagingSenderId: '430206835988',
  });

  const db = firebase.firestore();
  db.settings({ timestampsInSnapshots: true });

  return {
    db,
    configs: {
      secretKey: 'SMARTCUSTOMEROBSESSED_17002',
    }
  };
};
