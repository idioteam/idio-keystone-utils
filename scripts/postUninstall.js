/**
 * Created by Mat on 21/07/2016.
 */
var fs = require('fs'),
    path = require('path'),
    lib = require('./lib');

console.log('---------------------------------------------');
console.log('postUninstall');
console.log('---------------------------------------------');

lib.rimuovi(lib.assetsPath,'');