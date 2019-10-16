/**
 * Created by Mat on 21/07/2016.
 */
var fs = require('fs'),
    path = require('path'),
    lib = require('./lib');

console.log('---------------------------------------------');
console.log('postInstall');
console.log('---------------------------------------------');

//  Installo assets
var assetsPath = path.join(lib.appPath, 'node_modules', 'idio-keystone-utils', 'assets'),
    assets = fs.readdirSync(assetsPath);

assets.forEach(function(asset){
	
	if( path.extname(asset) === '' ){
	
		lib.creaCartella( asset );
		lib.copiaCartella( 'assets', asset );

	}else{
		
		lib.installa( path.join('assets', asset), asset );
		
	}
});


console.log('---------------------------------------------');
console.log('Ricorda di installare i moduli di grunt');
console.log('npm install grunt --save');
console.log('npm install grunt-execute --save');
console.log('npm install load-grunt-configs --save');
console.log('npm install load-grunt-tasks --save');
console.log('npm install time-grunt --save');
console.log('---------------------------------------------');