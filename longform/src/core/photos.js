// Photo assets for the film. Loaded once at boot; shots reference IMG.<name>.
export const PHOTO = {
  letter: 'assets/photos/sepia/letter_stock.jpg',
  muteesaPortrait: 'assets/photos/sepia/muteesa_portrait.jpg',
  muteesaCourt: 'assets/photos/sepia/muteesa_court.jpg',
  stanleyEngraving: 'assets/photos/sepia/stanley_engraving.jpg',
  pictureHistory: 'assets/photos/sepia/uganda_picture_history.jpg',
  mackayBook: 'assets/photos/sepia/mackay_book.jpg',
  monument: 'assets/photos/sepia/muteesa_monument.jpg',
  mackayPortrait: 'assets/photos/sepia/mackay_portrait.jpg',
  stanleyPortrait: 'assets/photos/sepia/stanley_portrait.jpg',
};

export const IMG = {};

export async function loadPhotos() {
  await Promise.all(Object.entries(PHOTO).map(([key, src]) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { IMG[key] = im; res(); };
    im.onerror = () => rej(new Error('missing photo: ' + src));
    im.src = src;
  })));
}
