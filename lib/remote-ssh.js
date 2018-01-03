'use babel';

import {
  CompositeDisposable
} from 'atom';
import stripJsonComments from 'strip-json-comments';
import {
  EventEmitter
} from 'events';
import Path from 'path';
const {
  exec
} = require('child_process');
const fs = require('fs-plus');

const RemoteSSH = {
  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'remote-ssh:start': () => this.start(),
      'remote-ssh:create-config': () => this.createConfigFile()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  start() {
    let filePath = this.getFilePath('./.ftpconfig');
    if (filePath != null) {
      try {
        if (fs.existsSync(filePath)) {
          fs.readFile(filePath, 'utf8', (err, res) => {
            if (err) {
              return error(err);
            }

            const data = stripJsonComments(res);
            let json;
            try {
              json = JSON.parse(data);
            } catch (e) {
              atom.notifications.addError('Remote SSH: Error loading .ftpconfig', {
                dismissible: true,
                detail: e
              });
              return;
            }

            if (process.platform == "win32") {
              let proc;
              if (typeof(json.session) !== "undefined" && json.session.length > 0) {
                proc = [
                  "kitty",
                  "-ssh",
                  "-2",
                  "-load", '"' + json.session + '"',
                  "-pw", '"' + json.pass + '"',
                  "-cmd", '"cd ' + json.remote + '"'
                ];
              } else if (json.integration == "conemu") {
                proc = [
                  'conemu64',
                  "-run",
                  "kitty",
                  "-ssh",
                  json.user + "@" + json.host,
                  "-pw", '"' + json.pass + '"',
                  "-P", '"' + json.port + '"',
                  "-cur_console:t:'" + json.host + "'",
                  "-cmd", '"cd ' + json.remote + '"'
                ];
              } else {
                proc = [
                  "kitty",
                  "-ssh",
                  json.user + "@" + json.host,
                  "-pw", '"' + json.pass + '"',
                  "-P", '"' + json.port + '"',
                  "-cmd", '"cd ' + json.remote + '"'
                ];
              }
              atom.notifications.addInfo('Remote SSH: Starting Kitty', {
                dismissible: true
              });
              // console.log(proc.join(' '))
              let event = exec(proc.join(' '));
            } else {
              atom.notifications.addInfo('Remote SSH: Non-Windows OSes are currently not supported, sorry.', {
                dismissible: true
              });
            }
          });
        }
      } catch (e) {
        atom.notifications.addWarning("Remote SSH: Couldn't start package", {
          dismissible: true,
          detail: e
        });
      }
    }
  },

  createConfigFile() {
    let defData = {
      "protocol": "",
      "host": "",
      "port": "",
      "user": "",
      "pass": "",
      "promptForPass": false,
      "remote": "/",
      "local": "",
      "agent": "",
      "privatekey": "",
      "passphrase": "",
      "hosthash": "",
      "ignorehost": true,
      "connTimeout": 10000,
      "keepalive": 10000,
      "keyboardInteractive": false,
      "remoteCommand": "",
      "remoteShell": "",
      "watch": [],
      "watchTimeout": 500,
      "session": "",
      "integration": ""
    };
    try {
      let configPath = this.getConfigPath();
      if (configPath.length == 0) {
        return;
      }
      let fileAlreadyExists = fs.existsSync(configPath);

      let write = true;
      if (fileAlreadyExists) {
        write = atom.confirm({
          message: 'Do you want to overwrite .ftpconfig?',
          detailedMessage: `A config already exists in ${configPath}`,
          buttons: {
            Yes: () => true,
            No: () => false,
          },
        });
      }

      if (write) {
        let json = JSON.stringify(defData, null, 4);
        fs.writeFile(configPath, json, (err) => {
          if (!err) {
            atom.workspace.open(configPath);
          } else {
            atom.notifications.addError("Remote SSH: Writing config file failed", {
              dismissible: true
            });
          }
        });
      }
    } catch (e) {
      atom.notifications.addWarning("Remote SSH: Couldn't write config file", {
        dismissible: true,
        detail: e
      });
    }
  },

  getFilePath(relativePath) {
    try {
      const self = this;
      const projectPath = self.getProjectPath();
      if (projectPath === false) {
        return false;
      }
      return Path.resolve(projectPath, relativePath);
    } catch (e) {
      atom.notifications.addError("Remote SSH: getFilePath failed", {
        dismissible: true,
        detail: e
      });
      return "";
    }
  },

  getProjectPath() {
    try {
      const self = this;
      let projectPath = null;

      const firstDirectory = atom.project.getDirectories()[0];
      if (firstDirectory != null) projectPath = firstDirectory.path;

      if (projectPath != null) {
        self.projectPath = projectPath;
        return projectPath;
      }
      atom.notifications.addError('Remote SSH: Could not load project path', {
        dismissible: true,
      });
      return false;
    } catch (e) {
      atom.notifications.addError("Remote SSH: Couldn't get project Path", {
        dismissible: true,
        detail: e
      });
      return false;
    }
  },

  getConfigPath() {
    return this.getFilePath('./.ftpconfig');
  }
};

export default RemoteSSH;