
function handleNavItemClick(item, smoothScrollFunction, checkboxClass) {
    item.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent the default jump to the target

  
        // Extract the full URL from the href attribute of the clicked navigation item
        const href = this.getAttribute('href');

        // Check if the href contains both a page link and a target (indicated by '#')
        const [pageLink, target] = href.split('#');

        if (pageLink) {
            // There's a page link and a target; navigate to the page first
            // console.log(window.location.pathname, pageLink, target);
            if (window.location.pathname === pageLink && target) {
                // console.log('inside')
                smoothScrollFunction(`#${target}`);
            }
            
            else {
                window.location.href = href;
            }
                
        }

        // Check if the href is a partial link (starts with '#')
        if (href && href.startsWith('#')) {
            // Handle partial link scenario
            const target = href;
            smoothScrollFunction(target);
        }

        // Add code to close the navigation menu (replace 'checkboxClass' with your actual checkbox class)
        const menuCheckbox = document.querySelector(checkboxClass);
        if (menuCheckbox) {
            menuCheckbox.checked = false;
        }
    });
}


export default handleNavItemClick;      