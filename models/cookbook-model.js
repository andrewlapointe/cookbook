const env = require('dotenv').config();
const api_class = require('./api');
const api = new api_class();
const cookbookModel = {};

cookbookModel.allRecipes = async function () {
    const result = await api.get(`/recipe/all`);
    return result;
};

cookbookModel.getRecipeById = async function (id) {
    const result = await api.get(`/recipe/${id}`);
    return result;
};

module.exports = cookbookModel;
