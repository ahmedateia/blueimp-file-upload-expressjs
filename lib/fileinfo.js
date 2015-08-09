/*jslint node: true */
'use strict';

var fs = require('fs');
var path = require('path');
var md5 = require('MD5');
// Since Node 0.8, .existsSync() moved from path to fs: 
var _existsSync = fs.existsSync || path.existsSync;

var getFileKey = function(filePath) {

    return path.basename(filePath);

};
var udf;

function FileInfo(file, opts, fields) {
    this.name = file.name;
    this.usrName = file.name;
    this.size = file.size;
    this.type = file.type;
    this.modified = file.lastMod;
    this.deleteType = 'DELETE';
    this.options = opts;
    this.key = getFileKey(file.path); 
    this.versions = {};
    this.proccessed = false;
    this.width = udf;
    this.height = udf;
    this.fields = fields;
    if (opts.saveFile) {
        this.safeName();
    }
}
FileInfo.prototype.update = function(file) {
    this.size = file.size;
};
FileInfo.prototype.safeName = function() {
    var nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;

    function nameCountFunc(s, index, ext) {
        return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
    }

    // Prevent directory traversal and creating hidden system files:
    this.name = path.basename(this.name).replace(/^\.+/, '');
    // Prevent overwriting existing files:
    while (_existsSync(this.options.uploadDir + '/' + this.name)) {
        this.name = this.name.replace(nameCountRegexp, nameCountFunc);
    }
};

FileInfo.prototype.initUrls = function() {

    var that = this;
    var baseUrl = that.options.uploadUrl.substr(1);
    if (this.error) return;
    if (!this.awsFile) {
        var ext = that.name.split('.').pop();
        var new_name =  md5(that.name+Math.floor((Math.random() * 1000000000)))+'.'+ext ;
        that.url = baseUrl + new_name;
        that.usrName =  new_name;
        
        //that.thumbnail = baseUrl + encodeURIComponent(that.thumbnailUrl);
        if (!that.hasVersionImages()) return;
        Object.keys(that.options.imageVersions).forEach(function(version) {
            console.log(version);
            if (_existsSync(that.options.uploadDir + '/' + version + '/' + that.name)) {
                 that[version] = baseUrl + version + '/' + new_name;
                 that[version+'_type'] = that.type;
                 that[version+'_size'] = that.size;
                 
            } else {
                that[version] = baseUrl + version + '/' + new_name;
                that[version+'_type'] = that.type;
                that[version+'_size']  = that.size;
            }
        });
        that.name = baseUrl + new_name;
        return;
    }

   // that.url = that.awsFile.url;
    /*that.deleteUrl = that.options.uploadUrl + that.url.split('/')[that.url.split('/').length - 1].split('?')[0];
    if (!that.hasVersionImages()) return;
    Object.keys(that.options.imageVersions).forEach(function(version) {
        that[version + 'Url'] = that.url;
    });*/

};

FileInfo.prototype.validate = function() {
    if (this.options.minFileSize && this.options.minFileSize > this.size) {
        this.error = 'File is too small';
    } else if (this.options.maxFileSize && this.options.maxFileSize < this.size) {
        this.error = 'File is too big';
    } else if (!this.options.acceptFileTypes.test(this.name)) {
        this.error = 'Filetype not allowed';
    }
    return !this.error;
};
FileInfo.prototype.hasVersionImages = function() {
    return (this.options.copyImgAsThumb && this.options.imageTypes.test(this.url));
};

module.exports = FileInfo;

module.exports.getFileKey = getFileKey;