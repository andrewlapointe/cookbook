const env = require('dotenv').config();
const { json } = require('express');
const api_class = require('./api');
const { body } = require('express-validator');
const api = new api_class();
const accountModel = {};

// TODO
accountModel.getAccountById = async function (id) {
    const result = 1;
    return result;
};

accountModel.getAccountByEmail = async function (email) {
    const result = await api.get(`/user/${email}`);
    return result;
};

accountModel.checkAccountExitsUsername = async function (username) {
    const usernameResult = await api.get(`/checkuser/username/${username}`);
    return usernameResult.data.usernameExists;
};

accountModel.checkAccountExitsEmail = async function (email) {
    const emailResult = await api.get(`/checkuser/email/${email}`);
    return emailResult.data.emailExists;
};

accountModel.registerNewAccount = async function (
    email,
    username,
    password_hash
) {
    const data = {
        email: email,
        username: username,
        password_hash: password_hash,
    };
    const result = await api.post('/user/new', JSON.stringify(data));
    return result;
};

accountModel.addUserList = async function (listName, userId, auth) {
    const result = await api.post(
        '/user/list/new',
        JSON.stringify({ user_id: userId, list_name: listName }),
        auth
    );
    return result;
};

accountModel.getUserLists = async function (userId, auth) {
    const result = await api.getWAuth(`/user/${userId}/lists/all`, auth);
    return result;
};

accountModel.getList = async function (listId, auth) {
    const result = await api.getWAuth(`/user/list/${listId}`, auth);
    return result;
};

accountModel.deleteList = async function (listId, auth) {
    const result = await api.delete(
        `/user/list/delete`,
        JSON.stringify({ list_id: listId }),
        auth
    );
    return result;
};

accountModel.addRecipeToList = async function (data, auth) {
    const result = await api.post(
        '/user/list/addrecipe',
        JSON.stringify(data),
        auth
    );
    return result.status;
};

accountModel.removeRecipeFromList = async function (data, auth) {
    const result = await api.delete(
        '/user/list/removerecipe',
        JSON.stringify(data),
        auth
    );
    return result.status;
};

module.exports = accountModel;
