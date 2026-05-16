import { saveBookmarks, getBookmarks } from './utils/storage.js';
let myBookmarks = getBookmarks(); 
function handleAddBookmark(article) {
    const exists = myBookmarks.find(b => b.url === article.url); //find() method help to go through hole array
    //b is array function it check weither URL is equal to artical if yes it store in variable exists
    
    if (!exists) {
        myBookmarks.push(article);
        saveBookmarks(myBookmarks); // Persistent Write
        renderBookmarksUI(); // Update your UI
    }
}