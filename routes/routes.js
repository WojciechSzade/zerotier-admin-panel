const express = require('express');
const axios = require('axios');
const router = express.Router();

const { networkId, zerotierToken } = require('../app.js');

async function getRoutes() {
    try {
      const response = await axios.get(`https://api.zerotier.com/api/v1/network/${networkId}`, {
        headers: {  
          'Authorization': `Bearer ${zerotierToken}`, 
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching network:', error.message);
      throw error;
    }
  }
  
router.get('/', async (req, res) => {
    try {
        const network = await getRoutes();
        console.log(network.config.routes);
        res.send(network);
    }
    catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
});

module.exports = router;