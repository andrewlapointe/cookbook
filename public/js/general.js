/**
 * @param  {string} activeId ID of selected DOM Element
 * @param {[string]} inactiveIds List of IDs of elements to hide
 */
const toggleActiveElement = (activeId, inactiveIds) => {
    document.getElementById(activeId).style.display = 'block';
    inactiveIds.forEach((element) => {
        document.getElementById(element).style.display = 'none';
    });
};

const flash = () => {
    let flashContainer = document.getElementById('messages');
    if (flashContainer) {
        flashContainer.classList.add('alert');
        flashContainer.classList.add('alert-primary');
        flashContainer.classList.add('my-4');
    }
    const xButton = document.createElement('button');
    xButton.classList = 'btn btn-primary';
    xButton.style.diplay = 'inline';
    xButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    xButton.setAttribute('onClick', 'hideFlash()');
    flashContainer.appendChild(xButton);
};

const hideFlash = () => {
    let flashContainer = document.getElementById('messages');
    flashContainer.style.display = 'none';
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

fillEditForm = (button) => {
    const recipe = JSON.parse(button.getAttribute('data-recipe'));

    document.getElementById('editRecipeName').value = recipe.title;
    document.getElementById('editAuthor').value = recipe.author;
    document.getElementById('editDescription').value = recipe.description;
    document.getElementById('editIngredients').value = recipe.ingredients;
    document.getElementById('editInstructions').value = recipe.instructions;
    document.getElementById('editCookTime').value = recipe.cooking_time;
    document.getElementById('editServings').value = recipe.servings;
    document.getElementById('editImageURL').value = recipe.image_url;
    document.getElementById('editRecipeId').value = recipe.id;

    document.getElementById(
        'edit-h2'
    ).innerHTML = `Edit ${recipe.title} Recipe <button onclick="editFormBack()" id="edit-form-back-btn" class="btn btn-sm btn-primary">Back</button>`;

    toggleActiveElement('edit-form', ['edit-list']);
};

editFormBack = () => {
    toggleActiveElement('edit-list', ['edit-form']);
    document.getElementById('edit-h2').innerHTML = 'Edit Recipe';
};

toggleMyRecipes = (button) => {
    const userId = JSON.parse(button.getAttribute('accountId'));
    const cards = document.querySelectorAll('.recipe-card');

    button.classList.toggle('active-custom');
    // if (button.getAttribute('aria-pressed') == 'false') {
    //     button.setAttribute('aria-pressed', 'true');
    // } else {
    //     button.setAttribute('aria-pressed', 'false');
    // }

    cards.forEach((recipe) => {
        const poster = JSON.parse(recipe.getAttribute('user-id'));
        if (poster !== userId) {
            recipe.classList.toggle('d-none');
        }
    });
};
