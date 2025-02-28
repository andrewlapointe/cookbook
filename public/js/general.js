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
    if (flashContainer) {
        flashContainer.classList.add('alert');
        flashContainer.classList.add('alert-primary');
        flashContainer.classList.add('my-4');
    }
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
    console.log(recipe);

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
