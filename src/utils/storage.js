const BOOKMARKS_KEY='sentriqo_news_bookmarks'; //use as name of folder to find location

export const saveBookmarks=(bookmarks)=>{
    try{
        const data=JSON.stringify(bookmarks); // it only takes string so convert array into string
        localStorage.setItem(BOOKMARKS_KEY,data); //predefine function
    }catch(error){
        console.error("Error saving to localStorage:",error);
    }
}


export const getBookmarks = () => {
    try {
        const data = localStorage.getItem(BOOKMARKS_KEY);
      //  return data ? JSON.parse(data) : [];  // it will convert string into Array this ternary operator
      let result;
if (data) {
  result = JSON.parse(data);  // it will convert string into Array
} else {
  result = [];
}
return result;
    } catch (error) {
        console.error("Error reading from localStorage:", error);
        return [];
    }
};
hriu3ehfjwebfkjbewfjvhbdehjfvb