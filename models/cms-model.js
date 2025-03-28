const env = require('dotenv').config();
const api_class = require('./api');
const api = new api_class();
const cmsModel = {};

cmsModel.createNewRecipe = async function (data, auth) {
    const result = await api.post('/recipe/new', JSON.stringify(data), auth);
    return result;
};

cmsModel.getRecipesByUser = async function (userId) {
    const result = await api.get(`/recipe/user/${userId}`);
    return result;
};

cmsModel.getRecipeIngredientsById = async function (id) {
    const result = await api.get(`/recipe/${id}/ingredients`);
    return result;
};

cmsModel.deleteRecipe = async function (data, auth) {
    const result = await api.delete(
        '/recipe/delete',
        JSON.stringify(data),
        auth
    );
    return result;
};

cmsModel.editRecipe = async function (data, auth) {
    const result = await api.put('/recipe/edit', JSON.stringify(data), auth);
    return result;
};

cmsModel.getAllUnits = async function () {
    const result = await api.get('/units/all');
    return result;
};

module.exports = cmsModel;
