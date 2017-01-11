/**
 * Created by zhigang on 14-8-15.
 */
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var gaze = require('gaze');
var _ = require('lodash');
var util = require('util');
var NODE_ENV, CONFIG_DIR,
    env = {};
var ENV = {
    development: 'development',
    testing: 'testing',
    production: 'production',
    stage: 'stage'
};
//NODE_ENV = ENV.development;//default env==development
var configUtil = (function () {

    this.configDirname = 'config';
    this.executePath = process.cwd();
    this._defaultConfigfilePath = path.join(this.executePath, this.configDirname);
    this.ConfigFileExtensions = ['*.json'];
    this.isDev = function () {
        return NODE_ENV.toLowerCase() == ENV.development;
    };
    this.isProduct = function () {
        return NODE_ENV.toLowerCase() == ENV.production;
    };
    this.isTesting = function () {
        return NODE_ENV.toLowerCase() == ENV.testing;
    };
    this.isStage = function () {
        return NODE_ENV.toLowerCase() == ENV.stage;
    };
    //---methods
    this.getEnv = function (name) {
        return env[name];
    };
    this.initParam = function (paramName, defaultValue) {
        var t = this;

        // Record and return the value
        var value = this.getCmdLineArg(paramName) || process.env[paramName] || defaultValue;
        env[paramName] = value;
        return value;
    };
    this.getCmdLineArg = function (searchFor) {
        var cmdLineArgs = process.argv.slice(2, process.argv.length),
            argName = '--' + searchFor + '=';

        for (var argvIt = 0; argvIt < cmdLineArgs.length; argvIt++) {
            if (cmdLineArgs[argvIt].indexOf(argName) === 0) {
                return cmdLineArgs[argvIt].substr(argName.length);
            }
        }

        return false;
    };
    //Strip all Javascript type comments from the string.
    this.stripComments = function (fileStr) {

        var uid = '_' + +new Date(),
            primitives = [],
            primIndex = 0;

        return (
            fileStr

                /* Remove strings */
                .replace(/(['"])(\\\1|.)+?\1/g, function (match) {
                    primitives[primIndex] = match;
                    return (uid + '') + primIndex++;
                })

                /* Remove Regexes */
                .replace(/([^\/])(\/(?!\*|\/)(\\\/|.)+?\/[gim]{0,3})/g, function (match, $1, $2) {
                    primitives[primIndex] = $2;
                    return $1 + (uid + '') + primIndex++;
                })

                /*
                 - Remove single-line comments that contain would-be multi-line delimiters
                 E.g. // Comment /* <--
                 - Remove multi-line comments that contain would be single-line delimiters
                 E.g. /* // <--
                 */
                .replace(/\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//g, '')

                /*
                 Remove single and multi-line comments,
                 no consideration of inner-contents
                 */
                .replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')

                /*
                 Remove multi-line comments that have a replaced ending (string/regex)
                 Greedy, so no inner strings/regexes will stop it.
                 */
                .replace(RegExp('\\/\\*[\\s\\S]+' + uid + '\\d+', 'g'), '')

                /* Bring back strings & regexes */
                .replace(RegExp(uid + '(\\d+)', 'g'), function (match, n) {
                    return primitives[n];
                })
            );

    };

    this.deepExtend = function (p, c) {
        self = this;
        var c = c || {};
        for (var i in p) {
            if (typeof  p[i] === 'object') {
                c[i] = (p[i].constructor == Array) ? [] : {};
                this.deepExtend(p[i], c[i]);
            } else {
                c[i] = p[i];
            }
        }
        return c;
    };
    this.makeHidden = function (object, property, value) {

        if (!object[property])
            return object;
        // Use the existing value if the new value isn't specified
        value = (typeof value == 'undefined') ? object[property] : value;

        // Create the hidden property
        Object.defineProperty(object, property, {
            value: value,
            enumerable: false

        });

        return object;
    }
    this.mapConfigPath = function (folder, filename) {
        return path.join(folder, filename);
    }
    this.parseFile = function (filepath) {
        var fileContent = null, configObject = null,
            fileExt = path.extname(filepath).slice(1);
        try {
            var stat = fs.statSync(filepath);
            if (!stat || stat.size < 1) {
                return null;
            }
        } catch (e1) {
            return null
        }
        // Try loading the file.
        try {
            fileContent = fs.readFileSync(filepath, 'UTF-8');
        }
        catch (e2) {
            throw new Error('Config file ' + filepath + ' cannot be read');
        }
        //parse the file
        try {
            if (fileExt == 'json') {
                configObject = JSON.parse(this.stripComments(fileContent));
            }
            else {
                throw  new Error('not supported !!')
            }
        } catch (err) {
            throw new Error("Cannot parse config file: '" + filepath + "': " + err);
        }
        return configObject;
    }
    return this;
})();

function baseConfigurationManager() {
    EventEmitter.call(this);
    this._configEntities = {};
    this._fileExts = configUtil.ConfigFileExtensions || ['*.json'];
    //this.filewatcher = new watcher(this._fileExts);
    this.configChangedHandler = [];
    this.baseConfigFolder = configUtil._defaultConfigfilePath;
}
util.inherits(baseConfigurationManager, EventEmitter)
baseConfigurationManager.prototype.getSection = function (section) {
    var self = this;
    var secName = section
    var entity = self.getEntity(secName);
    if (entity) {
        console.log('load from cache: ' + section);
    }
    if (!entity) {
        console.log('load from file: ' + section);
        entity = createConfigEntity.call(self, section);
        self._configEntities[secName] = entity;
    }
    return entity.value;
};

baseConfigurationManager.prototype.onCreate = function (entity) {

};
baseConfigurationManager.prototype.getEntity = function (name) {
    var entity;
//    if (_.has(this._configEntities, name)) {
//        entity = this._configEntities[name];
//    }
    entity = this._configEntities[name];
    return entity;
};
//baseConfigurationManager.prototype.NotifyConfigChanged = function (sectionName, conf) {
//    this.emit('changed', sectionName, conf);
//};
baseConfigurationManager.prototype.clearCache = function (sectionName) {
    var name = sectionName;
    delete this._configEntities[name]
}
function createConfigEntity(sectionName) {
    var entity = new configEntity(sectionName);
    entity.value = this.onCreate(entity);
    configUtil.makeHidden(entity, '__name');
    configUtil.makeHidden(entity, '__version');
    configUtil.makeHidden(entity, '__src');
    configUtil.makeHidden(entity, '__lastUpdateTime');
    return entity;
}
function configEntity(sectionName) {

    this.__version = 1;
    this.__name = sectionName;
    this.__lastUpdateTime = new Date();
    this.__src = null;
    this.value = null;

}

function baseConfig() {
    EventEmitter.call(this);
    //this.reloadConfigEventHandler = configInstances.getInstance().get(this.__name);
    this.notifyConfigChanged = function () {
        util.debug('emit changed event: ---' + this.__name);
        this.emit('changed', this);
    };
}
util.inherits(baseConfig, EventEmitter);


var localConfigManager = (function () {
    var initialize = _.once(function () {
        return new localManager();
    });
    var _i;//= initialize();

    //localManager is subclass of baseConfigurationManager
    function localManager() {
        baseConfigurationManager.call(this);

        this.configSource = loadConfigSource.call(this);
        this.configChangedHandler.push(reloadConfigSource);
        this.configChangedHandler.push(refreshCacheAndNotifiyChanged);
        var self = this;
        fileWatcher.getInstance().on('changed', function (event, filepath) {
            self.configChangedHandler.forEach(function (handler) {
                handler.call(self, event, filepath);
            });

        });

    }

    util.inherits(localManager, baseConfigurationManager);
    localManager.prototype.reload = function (sectionName) {
        var self = this;
        var _old = self.getEntity(sectionName);
        var confValue = GetSectionConfigSource(self.configSource, sectionName);
        var retVal = cloneConfig(confValue);
        var old_ver = 1, new_ver = 1;
        var _new = null;
        try {
            old_ver = parseInt(_old.__version)
        }
        catch (err) {
            console.log('parse __version property failed')
        }
        try {
            new_ver = parseInt(confValue.__version)
        }
        catch (err) {
            new_ver = old_ver;
            console.log('parse __version property failed')
        }
        var changed = !(_.isEqual(_old.value, retVal, function (a, b) {
            var eq = true;
            for (var i in b) {
                if (!_.isEqual(b[i], a[i])) {
                    eq = false;
                    break;
                }
            }
            return eq;
        }));
        if (!changed)
            return null;
        console.log('[localManager.reload]config changed ! reload config ' + _old.__name)
        _old.__version = new_ver;
        _old.__lastUpdateTime = new Date();
        for (var i in retVal) {
            _old.value[i] = retVal[i];
        }
//        if (old_ver < new_ver) {
//        _new = new configEntity(sectionName);
//        _new.__name = sectionName;
//        _new.__version = new_ver;
//        _new.__src = confValue['__src'];
//        configUtil.makeHidden(_new, '__name');
//        configUtil.makeHidden(_new, '__version');
//        configUtil.makeHidden(_new, '__src');
//        configUtil.makeHidden(_new, '__lastUpdateTime');
//        var config = wrapConfigObject(retVal, sectionName);
//
//        _new.value = config;
//        self._configEntities[sectionName.toLowerCase()] = _new;

//        }
        return _old;
    }
    localManager.prototype.onCreate = function (entity, type) {
        var self = this;
        var sectionName = entity.__name;
        var confValue = GetSectionConfigSource(self.configSource, sectionName);
        if (!confValue) {
            return null;
        }

        var retVal = cloneConfig(confValue);


        entity.__name = sectionName;
        entity.__version = confValue['__version'] || entity.__version;
        entity.__src = confValue['__src'];
        fileWatcher.getInstance().setupWatcher(entity.__src);

//        this.filewatcher.setupWatcher(entity.__src);
//        this.filewatcher.watched(function (err, w) {
//            util.debug('watch files: ' + JSON.stringify(w));
//        })
        var config = wrapConfigObject(retVal, sectionName);
        return config;

    };

    function wrapConfigObject(value, type) {
        if (value == 'undefined')
            return null;

        function extend(superClass, sub, name) {
            var _sub = Object.create(superClass);
            Object.defineProperty(_sub, '__name', {value: name, writable: false, enumerable: false, configurable: false});
            //_sub.prototype = superClass.prototype;
            _sub = configUtil.deepExtend(sub, _sub);

            return _sub;
        }

        var obj = extend(new baseConfig(), value, type);

        return obj;
    }

    function cloneConfig(confValue) {
        var retVal = configUtil.deepExtend(confValue['value']);
        configUtil.makeHidden(retVal, '__name');
        configUtil.makeHidden(retVal, '__version');
        configUtil.makeHidden(retVal, '__src');
        configUtil.makeHidden(retVal, '__lastUpdateTime');
        return retVal;
    }

    function reloadConfigSource(event, filepath) {
        var self = this;//typeof localManager;
//        var rest = _.filter(self.configSource, function (value) {
//            return value.src != filepath;
//        });

        self.configSource = null;

        self.configSource = loadConfigSource.call(self);

    }

    function refreshCacheAndNotifiyChanged(event, filepath) {
        var self = this;//typeof localManager;
        var sectionNames = getSectionNamesByFilepath.call(self, filepath);
        if (sectionNames && sectionNames.length > 0) {
            sectionNames.forEach(function (sectionName) {
                var config = self.reload(sectionName);
                if (config) {
                    util.debug('emit changed event [refreshCacheAndNotifiyChanged]: ---' + config.value.__name);
                    config.value.emit('changed', config.value);
                    //config.value.notifyConfigChanged.call(config.value);//notify changed event
                }
            });
        }
    }


    function getSectionNamesByFilepath(filepath) {
        var entities = this._configEntities;
        var results = [];
        for (var i in entities) {
            if (entities[i]['__src'] == filepath) {
                results.push(i);
            }
        }
        return results;
    }


    function GetSectionConfigSource(configSource, sectionName) {
        //var self = this;
        var conf = null;

        //return config object from the last config file;
        if (!(configSource && configSource.length > 0))
            return conf;
        else {

            configSource.forEach(function (s) {
                if (s.value) {
                    for (var i in s.value) {
                        if (i == sectionName) {
                            conf = conf || {};
                            conf['value'] = configUtil.deepExtend(s.value[i]);
                            conf['__src'] = s.src;
                            conf['__version'] = conf['value'].__version ? conf['value'].__version : s.value['__version'];
                        }
                    }
                }
            });
            return conf;
        }
    };

    function loadConfigSource() {
        var self = this,
            config = [];
        //NODE_ENV = configUtil.initParam('NODE_ENV', 'development');
        CONFIG_DIR = configUtil.initParam('NODE_CONFIG_DIR', self.baseConfigFolder);
        var baseNames = ['default', NODE_ENV];
        var exts = _.map(this._fileExts, function (v) {


            return path.extname(v).slice(1);
        });

        baseNames.forEach(function (baseName) {

            exts.forEach(function (ext) {
                var configObject;
                var fullName = configUtil.mapConfigPath(self.baseConfigFolder, baseName + '.' + ext);
                try {
                    configObject = configUtil.parseFile(fullName);
                }
                catch (err) {
                    util.debug(err);
                }
                if (configObject) {
                    config.push({src: fullName, value: configObject});

                }
            });
        });
        return config;
    };

    //private methods
    function parseFile(filepath) {
        var fileContent = null, configObject = null,
            fileExt = path.extname(filepath).slice(1);
        try {
            var stat = fs.statSync(filepath);
            if (!stat || stat.size < 1) {
                return null;
            }
        } catch (e1) {
            return null
        }
        // Try loading the file.
        try {
            fileContent = fs.readFileSync(filepath, 'UTF-8');
        }
        catch (e2) {
            throw new Error('Config file ' + filepath + ' cannot be read');
        }
        //parse the file
        try {
            if (fileExt == 'json') {
                configObject = JSON.parse(configUtil.stripComments(fileContent));
            }
            else {
                throw  new Error('not supported !!')
            }
        } catch (err) {
            throw new Error("Cannot parse config file: '" + filepath + "': " + err);
        }
        return configObject;
    }


    return {
        getInstance: function () {
            if (!_i) {
                _i = initialize();
            }
            return _i;
        }
    }
})();

var fileWatcher = (function () {
    var _instance = null;


    function watcher(exts) {
        EventEmitter.call(this);

        this.setMaxListeners(0);
        this._fileExts = exts || configUtil.ConfigFileExtensions || ['*.json'];
        this.CHANGE_CONFIG_DELAY = 3000;
        var _files = [];
        var chokidar = require('chokidar');
        var exts = _.map(this._fileExts, function (v) {


            return path.extname(v).slice(1);
        });
        var ignoredFunc = function (input) {
            var w = _.contains(exts, path.extname(input).slice(1));
            return !w;
        }
        var _fileWatcher = chokidar.watch(configUtil._defaultConfigfilePath, { ignored: ignoredFunc, persistent: true});
        //var _fileWatcher = new gaze.Gaze(this._fileExts, {cwd: configUtil._defaultConfigfilePath, interval: this.CHANGE_CONFIG_DELAY});
        this.setupWatcher = function (filepath) {
            //_files.push(filepath);
            if (!_.contains(_files, filepath)) {
                _files.push(filepath);
                _fileWatcher.add(filepath);
                console.log('watched file: ' + filepath);
            }

        };
//        this.watched = function (cb) {
//            cb = cb || function () {
//            };
//            _fileWatcher.watched(function (err, watchers) {
//                if (err) {
//                    return cb(err, null);
//                }
//                cb(null, watchers);
//            })
//        }

        var watcher = this;

        _fileWatcher.on('all', function (event, file) {
            var self = watcher;
            util.debug(file + ' was ' + event);
            fs.stat(file, function (err, stats) {
                if (err) {
                    if (err.code == 'ENOENT') {
                        _fileWatcher.remove(file);

                        setTimeout(
                            function () {
                                util.debug('deleted fired[_fileWatcher]: ' + file);
                                self.emit('changed', 'deleted', file);

                            }, self.CHANGE_CONFIG_DELAY
                        );
                    }
                }
                else {
                    if (event == 'add' || event == 'change' || event == 'addDir') {
                        setTimeout(
                            function () {

                                self.emit('changed', event, file);

                            }, self.CHANGE_CONFIG_DELAY
                        );
                        //util.debug('[_fileWatcher] reload config after ' + self.CHANGE_CONFIG_DELAY + ' ms ,' + file);
                    }
                }
            })
        });
    }

    util.inherits(watcher, EventEmitter);
    return {
        getInstance: function () {
            if (!_instance) {
                _instance = new watcher();
            }
            return _instance;
        }
    }
})();


//---RemoteConfigurationManager--config mata data---
var remoteConfigSetting = (function () {
    function RemoteConfigurationManagerSetting(opts) {
        var defaultSetting = {

            __version: 1,
            applicationName: 'application-name',
            timeInterval: 10000,
            timeout: 5000,
            remoteConfigurationUrl: 'http://localhost:8901/ConfigVersionHandler',
            localConfigurationFolder: configUtil._defaultConfigfilePath,
            checkRemoteConfig: true
        };
        var name = opts.filename || 'RemoteConfigurationManager.json';
        this.getFileName = function () {
            return name;
        }
        opts = _.defaults(opts, defaultSetting);

        this.applicationName = opts.applicationName;
        this.timeInterval = opts.timeInterval;
        this.timeout = opts.timeout;
        this.remoteConfigurationUrl = opts.remoteConfigurationUrl;
        this.localConfigurationFolder = opts.localConfigurationFolder;
        this.checkRemoteConfig = opts.checkRemoteConfig;

    };
    RemoteConfigurationManagerSetting.prototype.writeConfigManagerSetting = function () {
        var self = this;
        var content = JSON.stringify(self);

        this.ensureLocalApplicationFolder();
        var self = this;
        var content = JSON.stringify(self);

        this.ensureLocalApplicationFolder();
        var filepath = configUtil.mapConfigPath(self.localConfigurationFolder, self.getFileName());
        var exis = fs.existsSync(filepath);
        if (!exis) {
            fs.writeFileSync(filepath, content, 'utf-8');
        }

    };
    RemoteConfigurationManagerSetting.prototype.ensureLocalApplicationFolder = function () {
        var self = this;
        var b = fs.existsSync(self.localConfigurationFolder);
        if (!b) {
            fs.mkdirSync(self.localConfigurationFolder);
        }
    };
//-----end RemoteConfigurationManager
    var _instance = null;
    return{
        getInstance: function (opts) {
            if (!_instance) {
                _instance = new RemoteConfigurationManagerSetting(opts);
            }
            return _instance;
        }
    }
})();


function configSection(sectionName, downloadUrl, filename) {
    this.__version = 1;
    this.__name = sectionName;
    this.__downloadUrl = downloadUrl;
    this.__filename = filename;

};


var remoteConfigManager = (function () {
    function remoteManager() {
        baseConfigurationManager.call(this);
        this._remoteConfigSetting = getRemoteConfigFile.call(this);
        var setting = configUtil.parseFile(this._remoteConfigSetting);
        fileWatcher.getInstance().setupWatcher(this._remoteConfigSetting);
        if (setting.checkRemoteConfig) {
            setInterval(updateRemoteConfig, setting.timeInterval);
        }


    }

    util.inherits(remoteManager, baseConfigurationManager);

    function updateRemoteConfig() {
    }

    function getRemoteConfigFile() {
        var remoteFileName = 'RemoteConfigurationManager.json';
        var remotefile = configUtil.mapConfigPath(this.baseConfigFolder, remoteFileName);
        if (!fs.existsSync(remotefile)) {
            remoteConfigSetting.getInstance({localConfigurationFolder: this.baseConfigFolder, filename: remoteFileName})
                .writeConfigManagerSetting();
        }
        return remotefile;

    }

    var _instance = null;
    return {
        getInstance: function () {
            if (!_instance) {
                _instance = new remoteManager();
            }
            return _instance;
        }
    }
})
();

function readConfigFile(filePath, cb) {
    fs.readFile(filePath, 'utf-8', function (err, config) {
        var conf;
        try {
            conf = createConfigEntity(config);
            conf.__filename = conf.__filename || filePath;
            cb(conf);
        } catch (err) {
        }
    });
}

var ConfigManager = (function () {
    function instance() {
        EventEmitter.call(this);
        NODE_ENV = configUtil.initParam('NODE_ENV', ENV.development);
        if (!fs.existsSync(configUtil._defaultConfigfilePath)) {
            fs.mkdirSync(configUtil._defaultConfigfilePath);
        }

    }

    util.inherits(instance, EventEmitter);
    instance.prototype.getConfig = function (name) {
        var self = this;
        var local = localConfigManager.getInstance();


        var config = local.getSection(name);
        if (!config) {
            var remote = remoteConfigManager.getInstance();

            config = remote.getSection(name);
        }
        return config;
    }
    var _this = null;
    return {
        getInstance: function () {
            if (!_this) {
                _this = new instance();
            }
            return _this;
        }
    }
})();

//====config====module entry
var config = (function () {
    var configManager = ConfigManager.getInstance();
//    configManager.on('changed', function (sectionName) {
//        //todo: at localManager.addListener possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
//        if (changedHandlerCollection[sectionName.__name.toLowerCase()]) {
//            var value = configManager.getConfig(_name);
//
//            self.emit('changed', value);
//        }
//    });


    return {

        get: function (name) {

            var conf = configManager.getConfig(name);
            return conf;
        }
    }
})();
exports.config = config;
//====end===============