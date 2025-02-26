/**
 * @param  {string} activeId ID of selected DOM Element
 * @param {[string]} inactiveIds List of IDs of elements to hide
 */
const toggleActiveElement = (activeId, inactiveIds) => {
    console.log('Toggling');
    document.getElementById(activeId).style.display = 'block';
    inactiveIds.forEach((element) => {
        document.getElementById(element).style.display = 'none';
    });
};

const flash = () => {
    let flashContainer = document.getElementById('messages');
    flashContainer.classList.add('alert');
    flashContainer.classList.add('alert-primary');
    flashContainer.classList.add('my-4');
};
