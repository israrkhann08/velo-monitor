const axios = require("axios");
const config = require("../config");

const axiosInstance = axios.create({
  baseURL: config.VCO_URL,
  timeout: config.TIMEOUT,
  headers: {
    Authorization: `Token ${config.API_TOKEN}`,
    "Content-Type": "application/json",
  },
});

module.exports = axiosInstance;