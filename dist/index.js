var AutoLaunch, isPathAbsolute;

isPathAbsolute = require('path-is-absolute');

// Public: The main auto-launch class
module.exports = AutoLaunch = class AutoLaunch {
  /* Public */
  // options - {Object}
  //   :isHidden - (Optional) {Boolean}
  //   :mac - (Optional) {Object}
  //       :useLaunchAgent - (Optional) {Boolean}. If `true`, use filed-based Launch Agent. Otherwise use AppleScript
  //           to add Login Item
  //   :name - {String}
  //   :path - (Optional) {String}
  constructor({name, isHidden, mac, path}) {
    var versions;
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
    // Returns a Promise which resolves to a {Boolean}
    this.isEnabled = this.isEnabled.bind(this);
    this.fixOpts = this.fixOpts.bind(this);
    if (name == null) {
      throw new Error('You must specify a name');
    }
    this.opts = {
      appName: name,
      isHiddenOnLaunch: isHidden != null ? isHidden : false,
      mac: mac != null ? mac : {}
    };
    versions = typeof process !== "undefined" && process !== null ? process.versions : void 0;
    if (path != null) {
      if (!isPathAbsolute(path)) {
        // Verify that the path is absolute
        throw new Error('path must be absolute');
      }
      this.opts.appPath = path;
    } else if ((versions != null) && ((versions.nw != null) || (versions['node-webkit'] != null) || (versions.electron != null))) {
      this.opts.appPath = process.execPath;
    } else {
      throw new Error('You must give a path (this is only auto-detected for NW.js and Electron apps)');
    }
    this.fixOpts();
    this.api = null;
    if (/^win/.test(process.platform)) {
      this.api = require('./AutoLaunchWindows');
    } else if (/darwin/.test(process.platform)) {
      this.api = require('./AutoLaunchMac');
    } else if (/linux/.test(process.platform)) {
      this.api = require('./AutoLaunchLinux');
    } else {
      throw new Error('Unsupported platform');
    }
  }

  enable() {
    return this.api.enable(this.opts);
  }

  disable() {
    return this.api.disable(this.opts.appName, this.opts.mac);
  }

  isEnabled() {
    return this.api.isEnabled(this.opts.appName, this.opts.mac);
  }

  /* Private */
  // Corrects the path to point to the outer .app
  // path - {String}
  // macOptions - {Object}
  // Returns a {String}
  fixMacExecPath(path, macOptions) {
    // This will match apps whose inner app and executable's basename is the outer app's basename plus "Helper"
    // (the default Electron app structure for example)
    // It will also match apps whose outer app's basename is different to the rest but the inner app and executable's
    // basenames are matching (a typical distributed NW.js app for example)
    // Does not match when the three are different
    // Also matches when the path is pointing not to the exectuable in the inner app at all but to the Electron
    // executable in the outer app
    path = path.replace(/(^.+?[^\/]+?\.app)\/Contents\/(Frameworks\/((\1|[^\/]+?) Helper)\.app\/Contents\/MacOS\/\3|MacOS\/Electron)/, '$1');
    if (!macOptions.useLaunchAgent) {
      // When using a launch agent, it needs the inner executable path
      path = path.replace(/\.app\/Contents\/MacOS\/[^\/]*$/, '.app');
    }
    return path;
  }

  fixOpts() {
    var tempPath;
    this.opts.appPath = this.opts.appPath.replace(/\/$/, '');
    if (/darwin/.test(process.platform)) {
      this.opts.appPath = this.fixMacExecPath(this.opts.appPath, this.opts.mac);
    }
    if (this.opts.appPath.indexOf('/') !== -1) {
      tempPath = this.opts.appPath.split('/');
      this.opts.appName = tempPath[tempPath.length - 1];
    } else if (this.opts.appPath.indexOf('\\') !== -1) {
      tempPath = this.opts.appPath.split('\\');
      this.opts.appName = tempPath[tempPath.length - 1];
      this.opts.appName = this.opts.appName.substr(0, this.opts.appName.length - '.exe'.length);
    }
    if (/darwin/.test(process.platform)) {
      // Remove ".app" from the appName if it exists
      if (this.opts.appName.indexOf('.app', this.opts.appName.length - '.app'.length) !== -1) {
        return this.opts.appName = this.opts.appName.substr(0, this.opts.appName.length - '.app'.length);
      }
    }
  }

};
