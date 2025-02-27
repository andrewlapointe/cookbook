const axios = require('axios');
const env = require('dotenv').config();

const header_data = { headers: { 'Content-Type': 'application/json' } };

class API {
    // TODO Add error handling

    /**
     *
     * @param {string} route
     * @returns {json}
     */
    async get(route) {
        const apiResponse = await axios.get(
            process.env.API_PATH_PREFIX + route
        );
        return apiResponse;
    }

    /**
     *
     * @param {string} route
     * @param {json} body
     * @param {string} auth JWT token from login
     * @returns {json}
     */
    async post(route, body, auth) {
        // console.log(`AUTHORIZATION: ${auth}`);
        header_data.headers['authorization'] = auth;
        const apiResponse = await axios.post(
            process.env.API_PATH_PREFIX + route,
            body,
            header_data
        );
        delete header_data.headers['authorization'];
        return apiResponse;
    }

    /**
     *
     * @param {string} route
     * @param {json} body
     * @returns {json}
     */
    async put(route, body) {
        const apiResponse = await axios.put(
            process.env.API_PATH_PREFIX + route,
            body,
            header_data
        );
        return apiResponse;
    }

    /**
     *
     * @param {string} route
     * @param {json} body
     * @param {string} auth JWT token from login
     * @returns {json}
     */
    async delete(route, body, auth) {
        header_data.headers['authorization'] = auth;
        const apiResponse = await axios.delete(
            process.env.API_PATH_PREFIX + route,
            {
                headers: header_data.headers,
                data: body,
            }
        );
        delete header_data.headers['authorization'];
        return apiResponse;
    }
}

module.exports = API;
