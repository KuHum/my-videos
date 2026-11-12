// Photo assets for the film. Loaded once at boot; shots reference IMG.<name>.
export const PHOTO = {
  letter: 'assets/photos/letter_stock.jpg',
  muteesaPortrait: 'assets/photos/muteesa_portrait.jpeg',
  muteesaCourt: 'assets/photos/muteesa_court.jpg',
  stanleyEngraving: 'assets/photos/stanley_engraving.jpg',
  pictureHistory: 'assets/photos/uganda_picture_history.jpg',
  mackayBook: 'assets/photos/mackay_book.jpg',
  monument: 'assets/photos/muteesa_monument.jpg',
  mackayPortrait: 'assets/photos/mackay_portrait.jpg',
  stanleyPortrait: 'assets/photos/stanley_portrait.jpg',
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
