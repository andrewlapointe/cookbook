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

showConfirmModal = (message, onConfirm) => {
    document.getElementById('confirmMessage').innerText = message;
    const confirmBtn = document.getElementById('confirmBtn');

    // Remove previous event listeners to prevent multiple bindings
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document
        .getElementById('confirmBtn')
        .addEventListener('click', function () {
            onConfirm();
            var confirmModal = bootstrap.Modal.getInstance(
                document.getElementById('confirmModal')
            );
            confirmModal.hide();
        });

    // Show the modal
    var confirmModal = new bootstrap.Modal(
        document.getElementById('confirmModal')
    );
    confirmModal.show();
};
