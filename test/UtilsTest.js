/**
 * Created by zhigang on 14-8-15.
 */


var repl = require("repl");
var gaze = require('gaze');
var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');


//var f = new a();


var s = (function () {
    var _ = null;

    function init() {
        return new a();
    }

    //_ = init();
    return {
        getInstance: function () {
            if (!_) {
                _ = init();
            }
            return _;
        }

    }
})();
function a() {
    EventEmitter.call(this);
    this.a = 1;
}
util.inherits(a, EventEmitter);
a.prototype.get = function (n) {
    return n + 1
};
console.log(s.get(2));

//var conf = {__name: '123', web: {a: 1}, 'db': {d: 2}};
//function baseConf() {
//    this.__name = 'abc';
//    this.__version = 1;
//}
//console.log('keys: ' + _.keys(conf));
//var nconf = _.assign(new baseConf(), conf);
//console.log(nconf);
//console.log(nconf instanceof baseConf);
//
//
//function a() {
//    this.abc = 1;
//
//}
//a.prototype.hi = function () {
//    console.log('hi:' + this.abc);
//}
//function b() {
//    a.call(this);
//    this.name = 123;
//}
//b.prototype = new a();
//b.prototype.constructor = b;
//b.prototype.hi = function () {
//    console.log("sub hi: " + this.name);
//}
//var c = new b();
//c.hi();
//var d = {
//    a: 'd-a',
//    b: 'd-b',
//    c: {a: 1, b: 2}
//};
//var e = {
//    a: 'e-a',
//    c: {a: 'eca'},
//    d: ['e1', 'e2']
//}
//var f = {};
//f = _.assign(f, d);
//console.log(f);
//
//f = _.assign(f, e);
//console.log(f);
//console.log('f:' + JSON.stringify(f['c']));
//console.log('e:' + JSON.stringify(e['c']));
//console.log(f['c'] === e['c']);
//
//function deepExtend(p, c) {
//    var c = c || {};
//    for (var i in p) {
//        if (typeof  p[i] === 'object') {
//            c[i] = (p[i].constructor == Array) ? [] : {};
//            deepExtend(p[i], c[i]);
//        } else {
//            c[i] = p[i];
//        }
//    }
//    return c;
//}
//console.log('======')
//p = {};
//p = deepExtend(d);
//console.log(JSON.stringify(p));
//p = deepExtend(e,p);
//console.log(JSON.stringify(p));
//var config = require('config');
//var dbConfig = config.get('Customer.dbConfig');
//console.log(dbConfig);
//var watcher = new watcher({
//    root: __dirname,
//    filter: function(filename, stats) {
//        // only watch those files
//        if(filename.indexOf('.js') != -1) {
//            return true;
//        }
//        else {
//            return false;
//        }
//    }
//});
//watcher.on('change', function(e) { /* Watcher is an EventEmitter */
//console.log(e);
//});
//watcher.on('create', function(e) { /* Watcher is an EventEmitter */
//    console.log(e);
//});
//watcher.on('delete', function(e) { /* Watcher is an EventEmitter */
//    console.log(e);
//});
//watcher.watch(__dirname, function(err){
//    if (err){
//        console.log(err);
//    }
//});
//gaze('configs/*.json',function(err,watcher){
//    // Get all watched files
//    this.watched(function(err, watched) {
//        console.log(watched);
//    });

//    // On file changed
//    this.on('changed', function(filepath) {
//        console.log(filepath + ' was changed');
//    });
//
//    // On file added
//    this.on('added', function(filepath) {
//        console.log(filepath + ' was added');
//    });
//
//    // On file deleted
//    this.on('deleted', function(filepath) {
//        console.log(filepath + ' was deleted');
//    });

//    // On changed/added/deleted
//    this.on('all', function(event, filepath) {
//        console.log(filepath + ' was ' + event);
//    });
//
//    // Get watched files with relative paths 11
//    this.relative(function(err, files) {
//        console.log(files);
//    });
//});
//gaze('configs/default.json',function(err,watcher){
//
//});
//var Gaze = require('gaze').Gaze;//{cwd: path.join(process.cwd(), 'configs'), interval: 5000}
//var g = new Gaze();
//g.add(path.join(process.cwd(), 'configs', 'default.json'));
//g.on('all', function (event, filePath) {
//    console.log(filePath + ' was ' + event);
//});
//g.add(path.join(process.cwd(), 'configs', 'dn.json'));
//g.add(path.join(process.cwd(), 'configs', 'development.json'));
//g.watched(function (err,f) {
//    console.log(f);
//})
//fs.rename(path.join(process.cwd(), 'configs', 'development.json'),path.join(process.cwd(), 'configs', 'production.json'))
//g.add(path.join(process.cwd(), 'configs', 'production.json'));
//g.watched(function (err,f) {
//    console.log(f);
//})
repl.start({
    prompt: "node via stdin> ",
    input: process.stdin,
    output: process.stdout
});