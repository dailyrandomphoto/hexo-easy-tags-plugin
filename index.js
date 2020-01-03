'use strict';

const chalk = require('chalk');
const { slugize } = require('hexo-util');
const moduleName = require('./package.json').name;
const moduleConfigKey = 'easy_tags_plugin';

function init(hexo) {
  const { config, log, extend } = hexo;
  const moduleConfig = Object.assign({
    enable: true,
    tag_name_case: 0,
    tag_slug_case: 1,
    sort_ignore_case: true,
    action: 'correct' // correct, report
  }, config[moduleConfigKey]);

  if (!moduleConfig.enable) {
    return;
  }

  log.debug('=========== %s ===========', chalk.cyan(moduleName));
  log.debug('config %s', chalk.magenta(JSON.stringify(moduleConfig)));

  const prototype = hexo.model('Post').Document.prototype;
  const setTagsFunc = prototype.setTags;
  const allTags = {};
  const allConflictTags = {};
  let inited = false;
  if (moduleConfig.sort_ignore_case) {
    const Tag = hexo.model('Tag');
    Tag.schema.virtual('_sort_name').get(function() {
      const name = this.name;
      if (!name) return;

      return name.toLowerCase();
    });

    const listTagsHelper = extend.helper.get('list_tags');
    const tagCloudHelper = extend.helper.get('tagcloud');
    const orderbyOverrideHelper = func => function(tags, options) {
      if (!options && (!tags || !Object.prototype.hasOwnProperty.call(tags, 'length'))) {
        options = tags;
        tags = this.site.tags;
      }

      if (!tags || !tags.length) return '';
      options = options || {};

      if (!options.orderby || options.orderby === 'name') {
        options.orderby = '_sort_name';
      }
      return func.call(this, tags, options);
    };

    extend.helper.register('list_tags', orderbyOverrideHelper(listTagsHelper));
    extend.helper.register('tagcloud', orderbyOverrideHelper(tagCloudHelper));
    extend.helper.register('tag_cloud', orderbyOverrideHelper(tagCloudHelper));
  }

  if (moduleConfig.action === 'report') {
    extend.filter.register('before_generate', () => {
      scanConflictTags(hexo.model('Tag'));
      if (Object.keys(allConflictTags).length > 0) {
        // To get posts of tags
        hexo.locals.invalidate();
        printConflictTags();
        // process.exit(1); // eslint-disable-line no-process-exit
        throw new TypeError('Tag Name Conflicted');
      }
    });
  } else {
    // overwrite setTags method
    prototype.setTags = function(tags) {
      if (!inited) {
        // load all tags from database
        initAllTags();
      }

      tags = renameTags(tags);

      return setTagsFunc.call(this, tags);
    };
  }

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
        newName = transform(name);
        allTags[key] = newName;
      }

      // Ensure items are unique.
      if (!list.includes(newName)) {
        list.push(newName);
      }
      return list;
    }, []);
  }

  function scanConflictTags(tags) {
    tags.forEach(tag => {
      const name = tag.name;
      const key = makeKey(name);
      const tagStored = allTags[key];
      if (!tagStored) {
        allTags[key] = tag;
      } else if (tag._id !== tagStored._id) {
        const conflictTags = allConflictTags[key] || {};
        conflictTags[tagStored._id] = tagStored;
        conflictTags[tag._id] = tag;
        allConflictTags[key] = conflictTags;
      }
    });
  }

  function printConflictTags() {
    const msg = [];
    msg.push('========== Conflicted Tags ==========');
    for (const key in allConflictTags) {
      msg.push(`  tag slug: ${chalk.magenta(key)}`);

      const conflictTags = allConflictTags[key];

      let firstName;
      Object.values(conflictTags).sort(compareTag).forEach((tag, index) => {
        if (index === 0) {
          msg.push(`      tag name: ${chalk.cyan(tag.name)}`);
          firstName = tag.name;
        } else {
          msg.push(`      tag name: ${chalk.cyan(tag.name)}. Rename to ${chalk.cyan(firstName)} or define another slug in 'tag_map'. (e.g. ${tag.name}: ${makeKey(tag.name)}_${index})`);
        }
        if (tag.posts) {
          tag.posts.sort('date', 1).forEach((post, index) => {
            // Show the first 3 posts.
            if (index < 3) {
              msg.push(`              post: ${chalk.magenta(post.source)}`);
            } else if (index === 3) {
              msg.push('              ...');
            }
          });
        }
      });
    }
    log.error(msg.join('\n'));
  }

  function compareTag(a, b) {
    if (!a.posts) {
      return -1;
    }
    if (!b.posts) {
      return 1;
    }
    const dateA = a.posts.sort('date', 1).first().date;
    const dateB = b.posts.sort('date', 1).first().date;
    return dateA._d.getTime() - dateB._d.getTime();
  }

  function makeKey(name) {
    const map = config.tag_map || {};
    if (!name) return;

    if (Reflect.apply(Object.prototype.hasOwnProperty, map, [name])) {
      name = String(map[name] || name);
    }
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
