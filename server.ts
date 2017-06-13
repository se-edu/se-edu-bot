import sourceMapSupport = require('source-map-support');
sourceMapSupport.install();

if (require.main === module) {
    console.log('Hello world!');
}
