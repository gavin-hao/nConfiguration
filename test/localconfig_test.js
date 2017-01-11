/**
 * Created by zhigang on 14-8-26.
 */
var config = require('../lib/config.js');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var repl = require("repl");
//function conf1(){
//    baseConfig.call(this);
//}
//util.inherits(conf1,baseConfig);
//conf1.get();
//conf1.on('changed',function(){})

var v = config.config.get('web');
console.log(v);
console.log('get web config again----v')
var s = config.config.get('web');
console.log(s.host + '---------V');
console.log(s === v);

v.on('changed', function (entity) {
    console.log('changed:[v] ' + JSON.stringify(entity));
});

var cust = config.config.get('Customer');
console.log(JSON.stringify(cust) + '---------V');
cust.on('changed', function (entity) {
    console.log('changed:[cust] ' + JSON.stringify(entity));
});
repl.start({
    prompt: "node via stdin> ",
    input: process.stdin,
    output: process.stdout
});