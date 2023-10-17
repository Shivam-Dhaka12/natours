
const scrollWrapper = document.querySelector(".scroll-wrapper");

export const scrollLeft = () => {
    scrollWrapper.scrollLeft -= 310; // Adjust the scrolling distance as needed
}

export const scrollRight = () => {
    scrollWrapper.scrollLeft += 310; // Adjust the scrolling distance as needed
}
