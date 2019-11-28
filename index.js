'use strict';

const chalk = require('chalk');
const { slugize } = require('hexo-util');
const moduleName = require('./package.json').name;
const moduleConfigKey = 'easy_tags_plugin';

function init(hexo) {
  const { config, log } = hexo;
  const moduleConfig = Object.assign({
    enable: true,
    tag_name_case: 0,
    tag_slug_case: 1
  }, config[moduleConfigKey]);

  if (!moduleConfig.enable) {
    return;
  }

  log.debug('=========== %s ===========', chalk.cyan(moduleName));
  log.debug('config %s', chalk.magenta(JSON.stringify(moduleConfig)));

  const prototype = hexo.model('Post').Document.prototype;
  const setTagsFunc = prototype.setTags;
  const allTags = {};
  let inited = false;

  // overwrite setTags method
  prototype.setTags = function(tags) {
    if (!inited) {
      // load all tags from database
      initAllTags();
    }

    tags = renameTags(tags);

    return setTagsFunc.call(this, tags);
  };

  // load all tags from database
  function initAllTags() {
    renameTags(hexo.model('Tag').map(tag => tag.name));
    inited = true;
  }

  // Corrects tag names and return non-duplicated tag names
  function renameTags(tags) {
    return tags.reduce((list, name) => {
      const key = makeKey(name);
      let newName = allTags[key];
      if (!newName) {
        newName = allTags[key] = transform(name);
      }

      // Ensure items are unique.
      if (list.indexOf(newName) === -1) {
        list.push(newName);
      }
      return list;
    }, []);
  }

  function makeKey(name) {
    return slugize(name, {transform: 1});
  }

  function transform(name) {
    switch (moduleConfig.tag_name_case) {
      case 1:
        return name.toLowerCase();

      case 2:
        return name.toUpperCase();

      default:
        return name;
    }
  }
}

module.exports = init;

// execute from hexo plugin loader
if (typeof hexo !== 'undefined') {
  init(hexo); // eslint-disable-line no-undef
}
