// debug-responsehandler.js
const ResponseHandler = require('./services/responseHandler');

console.log('ResponseHandler methods:');
console.log('success:', typeof ResponseHandler.success === 'function');
console.log('created:', typeof ResponseHandler.created === 'function');
console.log('error:', typeof ResponseHandler.error === 'function');
console.log('badRequest:', typeof ResponseHandler.badRequest === 'function');
console.log('unauthorized:', typeof ResponseHandler.unauthorized === 'function');
console.log('forbidden:', typeof ResponseHandler.forbidden === 'function');
console.log('notFound:', typeof ResponseHandler.notFound === 'function');
console.log('conflict:', typeof ResponseHandler.conflict === 'function');
console.log('serverError:', typeof ResponseHandler.serverError === 'function');