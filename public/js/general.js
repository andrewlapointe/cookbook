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
        const xButton = document.createElement('button');
        xButton.classList = 'btn btn-primary';
        xButton.style.diplay = 'inline';
        xButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        xButton.setAttribute('onClick', 'hideFlash()');
        flashContainer.appendChild(xButton);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    flash();
});

const hideFlash = () => {
    let flashContainer = document.getElementById('messages');
    flashContainer.style.display = 'none';
};

showConfirmModal = (message, onConfirm) => {
    document.getElementById('confirmMessage').innerHTML = message;
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

    document.getElementById('editIngredientName').value =
        recipe.ingredients[0].ingredient;
    document.getElementById('editIngredientAmount').value =
        recipe.ingredients[0].quantity;
    document.getElementById('editIngredientUnit').value =
        recipe.ingredients[0].unit;

    if (recipe.ingredients.length > 1) {
        for (let i = 1; i < recipe.ingredients.length; i++) {
            cmsAddIngredient('edit-ingredient-container', i);
            document.getElementById('ingredient' + i).value =
                recipe.ingredients[i].ingredient;
            document.getElementById('ingredientAmount' + i).value =
                recipe.ingredients[i].quantity;
            document.getElementById('ingredientUnit' + i).value =
                recipe.ingredients[i].unit;
        }
    }

    document.getElementById('editRecipeName').value = recipe.title;
    document.getElementById('editAuthor').value = recipe.author;
    document.getElementById('editDescription').value = recipe.description;
    // document.getElementById('editIngredients').value = recipe.ingredients;
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

cmsAddIngredient = (containerId, inc = 0) => {
    const container = document.getElementById(containerId);
    const ingredient_unit = document.getElementById('ingredientUnit');
    const units = ingredient_unit.cloneNode(true);

    // TODO: change this to a jQuery duplicate.
    container.insertAdjacentHTML(
        'beforeEnd',
        `
        <div class="row mt-2">
            <div class="col">
              <input class="form-control" id="ingredient${inc}" name="ingredient" rows="3" placeholder="Ingredient Name" required></input>
            </div>
            <div class="col-3">
              <input class="form-control" type="text" name="ingredientAmount" id="ingredientAmount${inc}" placeholder="Ingredient Amount">
            </div>
            <div class="col-2">
                <select class="form-control" name="ingredientUnit" id="ingredientUnit${inc}">
                    ${units.innerHTML}
                </select>
            </div>
            <div class="col-2">
              <button id="remove-btn" class="btn btn-danger form-control" onclick="cmsRemoveIngredient(this)">
                Remove
              </button>
            </div>
        `
    );
};

const cmsRemoveIngredient = (button) => {
    button.parentElement.parentElement.remove();
};

// Used on the profile page to show the "add list" form
showAddListItem = () => {
    $('li#add-list-item').toggle();
};

showUserList = (list_element) => {
    const id = list_element.list - id;
    const name = list_element.list - name;
};

// displays user list contents on profile page
$('.list-name-group').on('click', (event) => {
    const id = event.currentTarget.attributes['data-list-id'].value;
    showActiveList(id);
});

removeRecipeFromListClient = (recipe_id, list_id) => {
    $.ajax({
        url: '/account/list/removerecipe',
        type: 'DELETE',
        data: {
            listId: list_id,
            recipeId: recipe_id,
        },
    });
    $(`li#${recipe_id}-list-item`).css('display', 'none');
};

showActiveList = (listId) => {
    $('ul#user-lists-ul').parent().css('display', 'none');
    $('div#active-list-container').css('display', 'block');
    $('div.recipe-list').each(function () {
        $(this).css('display', 'none');
    });
    $(`div#recipe-list-${listId}`).css('display', 'block');
};

showAllLists = () => {
    $('div#active-list-container').css('display', 'none');
    $('ul#active-list').empty();
    $('ul#user-lists-ul').parent().css('display', 'block');
};

confirmDeleteList = (aTag) => {
    const listId = aTag.getAttribute('data-list-id');
    const listName = aTag.getAttribute('data-list-name');

    const message = `Are you sure you want to delete the list <strong>${listName}</strong>?\nThis cannot be undone.`;
    const callback = () => {
        // TODO: change fetch for a jQuery ajax call
        fetch(`/account/list/delete/${listId}`, { method: 'DELETE' });
        $(`li#userList${listId}`).css('display', 'none');
    };
    showConfirmModal(message, callback);
};

addUserList = () => {
    $('#add-list-form').submit(function (event) {
        event.preventDefault();

        let $form = $(this),
            term = $form.find('input[name="listName"]').val(),
            url = $form.attr('action');

        let posting = $.ajax({
            url: url,
            type: 'POST',
            data: { listName: term },
            dataType: 'json',
            success: function (data, status) {
                const clone = $('li.userListLi:first').clone();

                $('li#add-list-item').before(clone);

                clone.attr('id', 'userList' + data[0].id);
                const aTag = clone.children('div').children('a:first');
                aTag.attr('data-list-id', data[0].id);
                aTag.html(term);

                const dropdownDiv = clone
                    .children('div')
                    .children('div.dropdown');
                dropdownDiv
                    .children('button')
                    .attr('id', 'dropdownMenuButton' + data[0].id);
                dropdownDiv
                    .children('div.dropdown-menu')
                    .attr('aria-labelledby', 'dropdownMenuButton' + data[0].id)
                    .children('a')
                    .attr('data-list-id', data[0].id)
                    .attr('data-list-name', term);

                showAddListItem();
            },
        });

        $('#add-list-form').trigger('reset');
        // posting.done(() => {
        // });
    });
};

buildSaveRecipeModal = () => {
    const formUrl = $('form#saveRecipeForm').attr('action');
    $('form#saveRecipeForm').on('submit', (event) => {
        event.preventDefault();

        const formData = {};

        let isSaved;

        // Get all the input fields, including checkboxes
        $('form#saveRecipeForm input').each((index, input) => {
            if (input.type === 'checkbox') {
                // If the checkbox is checked, add it to the formData object
                let temp = input.value;
                if (input.checked) {
                    formData[index] = {
                        id: temp,
                        value: true,
                    };
                    isSaved = true;
                } else {
                    formData[index] = {
                        id: temp,
                        value: null,
                    };
                }
            }
        });

        if (isSaved) {
            saveButtonOn();
        }
        // Convert the object to a JSON string
        const jsonData = JSON.stringify(formData);

        $.ajax({
            type: 'POST',
            url: formUrl,
            data: jsonData,
            processData: false, // Prevent jQuery from processing the data
            contentType: 'application/json', // Let the browser set the content type
            success: (response) => {},
            error: (error) => {},
        });
    });
};

saveButtonOn = (userLists, recipeId) => {
    $('i#saveIcon').removeClass().addClass('fa-solid fa-bookmark mx-2');
};

showAddNewListRecipePage = () => {
    $('div#add-list-container').show();
    $('div#add-list-button-container').hide();
};

addUserListRecipePage = () => {
    let $form = $('#add-list-container'),
        term = $form.children('input#listName').val(),
        url = $form.attr('action');

    let posting = $.ajax({
        url: url,
        type: 'POST',
        data: { listName: term },
        dataType: 'json',
        success: function (data, status) {
            const clone = $('div.form-check:first').clone();

            clone.children('label').html(term);
            clone.children('input').val(data[0].id);
            clone.children('input').attr('checked', false);

            $('div.form-check:first').before(clone);

            $('div#add-list-container').hide();
            $('div#add-list-container').children('input').val('');
            $('div#add-list-button-container').show();
        },
    });
};
