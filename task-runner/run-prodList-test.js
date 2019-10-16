/**
 * Created by Mat on 07/01/2016.
 */
var produzione = require('../index.js').prodList;
var done = function(){
	console.log('\n\t\t---Fine---\n\n');
};
produzione(true, done);
