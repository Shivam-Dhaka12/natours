// index.js

// Define your media query

  
  // Your function to replace low-res with high-res images
  export const replaceLowResWithHighRes = (elementSelector, highResImageURL) => {
      // Your implementation here...
      const element = document.querySelector(elementSelector);
      if (!element) {
          return;
      }
  
      const highResImage = new Image();
      highResImage.src = highResImageURL;
  
      highResImage.onload = function() {
          const currentBackground = getComputedStyle(element).backgroundImage;
          const gradientPart = currentBackground.slice(0, currentBackground.indexOf('url('));
          element.style.backgroundImage = `${gradientPart} url('${highResImage.src}')`;
// Fading in the high-resolution image
      };
  }
  

  