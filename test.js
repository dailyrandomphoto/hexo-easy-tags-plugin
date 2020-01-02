'use strict';

const { expect } = require('chai');
const Hexo = require('hexo');
const init = require('./index.js');

describe('something', () => {

  let hexo = new Hexo(__dirname);
  let Post = hexo.model('Post');

  hexo.config.easy_tags_plugin = {};

  beforeEach(() => {
    hexo = new Hexo(__dirname);
    Post = hexo.model('Post');
    hexo.config.easy_tags_plugin = {};
    return hexo.init()
      .then(() => Post.insert([
        {source: 'foo', slug: 'foo'},
        {source: 'bar', slug: 'bar'},
        {source: 'baz', slug: 'baz'},
        {source: 'boo', slug: 'boo'}
      ]))
      .then(posts =>
        Promise.all([
          ['foo'],
          ['baz'],
          ['baz'],
          ['Bar']
        ].map((tags, i) => posts[i].setTags(tags))));
  });

  it('should convert to used tag names', () => {
    let id;

    init(hexo);

    return Post.insert({
      source: 'foo.md',
      slug: 'foo'
    }).then(post => {
      id = post._id;
      return post.setTags(['Foo', 'Bar']);
    }).then(() => {
      const post = Post.findById(id);

      expect(post.tags.map(tag => tag.name)).to.be.eql(['foo', 'Bar']);

      return Post.removeById(id);
    });
  });

  it('should transform tag names to lowercase', () => {
    let id;
    hexo.config.easy_tags_plugin.tag_name_case = 1;

    init(hexo);

    return Post.insert({
      source: 'foo.md',
      slug: 'foo'
    }).then(post => {
      id = post._id;
      return post.setTags(['Java', 'JAVA']);
    }).then(() => {
      const post = Post.findById(id);

      expect(post.tags.map(tag => tag.name)).to.be.eql(['java']);

      hexo.config.easy_tags_plugin.tag_name_case = 0;

      return Post.removeById(id);
    });
  });

  it('should report conflicted tag names', () => {
    let id;
    hexo.config.easy_tags_plugin.action = 'report';

    init(hexo);

    return Post.insert({
      source: 'foo.md',
      slug: 'foo'
    }).then(post => {
      id = post._id;
      return post.setTags(['Foo', 'bar', 'BAR']);
    }).then(() => {
      const post = Post.findById(id);

      expect(post.tags.map(tag => tag.name)).to.be.eql(['Foo', 'bar', 'BAR']);

      hexo.config.easy_tags_plugin.action = 'correct';

      return Post.removeById(id);
    });
  });
});
