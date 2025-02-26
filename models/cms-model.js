const env = require('dotenv').config();
const api_class = require('./api');
const api = new api_class();
const cmsModel = {};

cmsModel.createNewRecipe = async function (data, auth) {
    const result = await api.post('/recipe/new', JSON.stringify(data), auth);
    console.log(`Results are: ${result.body}`);
    return result;
};

module.exports = cmsModel;
