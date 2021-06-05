var admin = require('firebase-admin');

var serviceAccount = require('./manga-reader-994fc-firebase-adminsdk-uu0r7-29cde757ee.json');

var fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://manga-reader-994fc.firebaseio.com',
});

/**
 * Gets list of all manga from firestore manga collection and writes to a file
 * @param {[object]} results array of manga object
 */
const writeMappingToFile = async () => {
  const mangaRef = admin.firestore().collection('manga');
  const mangaQuery = await mangaRef.get();

  const results = mangaQuery.docs.map((x) => x.data());

  const mapping = {};

  results.forEach((element) => {
    mapping[element.id] = {
      newId: '',
      title: element.title,
    };
  });

  fs.writeFile('mapping.json', JSON.stringify(mapping), (err) => {
    if (err) console.log('error', err);
  });
};

// writeMappingToFile();

/**
 * Read mapping file for old id -> new id
 * Updates the mangaIds inside of manga collection from firestore
 */
const updateMangaIds = async () => {
  const mangaRef = admin.firestore().collection('manga');

  let data = fs.readFileSync('mapping.json');
  let parsed = JSON.parse(data);

  // TODO make updates here
  mangaRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      // do updates here
      const id = doc.data().id;
      // console.log(parsed[id]);
      const newId = parsed[id].newId;
      // console.log(newId)
      doc.ref.update({
        id: newId
      })
    });
  });
};

// updateMangaIds();

/**
 * Read mapping file for old id -> new id
 * Updates the mangaIds inside of user collection from firestore
 */
const updateUserMangaIds = async () => {
  let data = fs.readFileSync('mapping.json');
  let parsed = JSON.parse(data);

  const userRef = admin.firestore().collection('user');
  userRef.where('userId', '==', "1").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const mymangaIds = doc.data().mangaIds;

      const newMangaIds = [];
      mymangaIds.forEach(element => {
        newMangaIds.push(parsed[element].newId);
      });
      console.log(newMangaIds);
      doc.ref.update({
        mangaIds: newMangaIds
      })
    })
  });
}

// updateUserMangaIds()

/**
 * Updates image urls for all mangas in firestore manga collection
 */
const updateImageUrls = async () => {
  const mangaRef = admin.firestore().collection('manga');
  const snapshot = await mangaRef.get();

  // get a new write batch
  const batch = admin.firestore().batch();

  snapshot.forEach((doc) => {
    // replace mkklcdnv6 with mkklcdnv6temp
    const imageUrl = doc.data().imageUrl;
    const newImageUrl = imageUrl.replace('mkklcdnv6', 'mkklcdnv6temp');
    batch.update(doc.ref, {imageUrl: newImageUrl});
  });

  // commit the batch
  await batch.commit();
}