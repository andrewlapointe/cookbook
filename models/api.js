const axios = require('axios');
const env = require('dotenv').config();

const headers = {
    headers: { 'Content-Type': 'application/json' },
};

class API {
    // TODO Add error handling
    async get(route) {
        const apiResponse = await axios.get(
            process.env.API_PATH_PREFIX + route
        );
        return apiResponse;
    }
    async post(route, json) {
        const apiResponse = await axios.post(
            process.env.API_PATH_PREFIX + route,
            json,
            headers
        );
        return apiResponse;
    }
    async put(route, json) {
        const apiResponse = await axios.put(
            process.env.API_PATH_PREFIX + route,
            json,
            headers
        );
        return apiResponse;
    }
    async delete(route, json) {
        const apiResponse = await axios.delete(
            process.env.API_PATH_PREFIX + route,
            json,
            headers
        );
        return apiResponse;
    }
}

module.exports = API;
