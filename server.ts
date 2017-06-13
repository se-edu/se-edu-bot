import sourceMapSupport = require('source-map-support');
sourceMapSupport.install();

import dotenv = require('dotenv');
dotenv.config();

if (require.main === module) {
    console.log('Hello world!');
}
