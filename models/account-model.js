const env = require('dotenv').config();
const api_class = require('./api');
const api = new api_class();
const accountModel = {};

// TODO
accountModel.getAccountById = async function (id) {
    const result = 1;
    console.log(result);
    return result;
};

accountModel.getAccountByEmail = async function (email) {
    const result = await api.get(`/user/${email}`);
    return result;
};

accountModel.checkAccountExits = async function (email, username) {
    const result = await api.get(`/checkuser/${email}/${username}`);
    return result;
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

module.exports = accountModel;
