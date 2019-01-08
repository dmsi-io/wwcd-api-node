const firebase = require('firebase-admin');

const serviceAccount = require('./key');

module.exports = () => {
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://wwcd-f0480.firebaseio.com',
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
