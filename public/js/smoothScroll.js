function smoothScroll(target) {
    // console.log(target);
    const element = document.querySelector(target);
    if (element) {
      window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }
}
  
export default smoothScroll;