'use strict';

const { expect } = require('chai');
const Hexo = require('hexo');
const init = require('./index.js');

describe('hexo-easy-tags-plugin', () => {
  const ctx = {};
  let Post,
    listTags,
    tagcloud;
  ctx.url_for = require('hexo/lib/plugins/helper/url_for').bind(ctx);

  const initialize = pluginConfig => {
    const hexo = new Hexo(__dirname);
    ctx.config = hexo.config;
    Post = hexo.model('Post');

    return hexo.init()
      .then(() => {
        hexo.config.easy_tags_plugin = pluginConfig;
        init(hexo);
      })
      .then(() => Post.insert([
        {source: 'foo', slug: 'foo'},
        {source: 'bar', slug: 'bar'},
        {source: 'baz', slug: 'baz'},
        {source: 'boo', slug: 'boo'}
      ]))
      .then(posts =>
        Promise.all([
          ['FOO', 'baz'],
          ['baz'],
          ['Baz'],
          ['Bar', 'foo']
        ].map((tags, i) => posts[i].setTags(tags))))
      .then(() => {
        hexo.locals.invalidate();
        ctx.site = hexo.locals.toObject();
        listTags = hexo.extend.helper.get('list_tags').bind(ctx);
        tagcloud = hexo.extend.helper.get('tagcloud').bind(ctx);
      });
  };

  it('should convert to used tag names', () => {
    let id;

    return initialize()
      .then(() => Post.insert({
        source: 'foo.md',
        slug: 'foo'
      })).then(post => {
        id = post._id;
        return post.setTags(['Foo', 'Bar']);
      }).then(() => {
        const post = Post.findById(id);

        expect(post.tags.map(tag => tag.name)).to.be.eql(['FOO', 'Bar']);

        return Post.removeById(id);
      });
  });

  it('should transform tag names to lowercase', () => {
    let id;

    return initialize({tag_name_case: 1})
      .then(() => Post.insert({
        source: 'foo.md',
        slug: 'foo'
      })).then(post => {
        id = post._id;
        return post.setTags(['Java', 'JAVA']);
      }).then(() => {
        const post = Post.findById(id);

        expect(post.tags.map(tag => tag.name)).to.be.eql(['java']);

        return Post.removeById(id);
      });
  });

  it('should report conflicted tag names', () => {
    let id;

    return initialize({action: 'report'})
      .then(() => Post.insert({
        source: 'foo.md',
        slug: 'foo'
      })).then(post => {
        id = post._id;
        return post.setTags(['Foo', 'bar', 'BAR']);
      }).then(() => {
        const post = Post.findById(id);

        expect(post.tags.map(tag => tag.name)).to.be.eql(['Foo', 'bar', 'BAR']);

        return Post.removeById(id);
      });
  });

  describe('list_tags', () => {
    it('default: sort case insensitive', () => {
      return initialize()
        .then(() => {
          const result = listTags();

          expect(result).to.be.eql([
            '<ul class="tag-list" itemprop="keywords">',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/Bar/" rel="tag">Bar</a><span class="tag-list-count">1</span></li>',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/baz/" rel="tag">baz</a><span class="tag-list-count">3</span></li>',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/FOO/" rel="tag">FOO</a><span class="tag-list-count">2</span></li>',
            '</ul>'
          ].join(''));
        });
    });

    it('sort case insensitive', () => {
      return initialize({sort_ignore_case: true})
        .then(() => {
          const result = listTags();

          expect(result).to.be.eql([
            '<ul class="tag-list" itemprop="keywords">',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/Bar/" rel="tag">Bar</a><span class="tag-list-count">1</span></li>',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/baz/" rel="tag">baz</a><span class="tag-list-count">3</span></li>',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/FOO/" rel="tag">FOO</a><span class="tag-list-count">2</span></li>',
            '</ul>'
          ].join(''));
        });
    });

    it('sort case sensitive', () => {
      return initialize({sort_ignore_case: false})
        .then(() => {
          const result = listTags();

          expect(result).to.be.eql([
            '<ul class="tag-list" itemprop="keywords">',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/Bar/" rel="tag">Bar</a><span class="tag-list-count">1</span></li>',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/FOO/" rel="tag">FOO</a><span class="tag-list-count">2</span></li>',
            '<li class="tag-list-item"><a class="tag-list-link" href="/tags/baz/" rel="tag">baz</a><span class="tag-list-count">3</span></li>',
            '</ul>'
          ].join(''));
        });
    });

  });

  describe('tagcloud', () => {
    it('default: sort case insensitive', () => {
      return initialize()
        .then(() => {
          const result = tagcloud();

          expect(result).to.be.eql([
            '<a href="/tags/Bar/" style="font-size: 10px;">Bar</a>',
            '<a href="/tags/baz/" style="font-size: 20px;">baz</a>',
            '<a href="/tags/FOO/" style="font-size: 15px;">FOO</a>'
          ].join(' '));
        });
    });

    it('sort case insensitive', () => {
      return initialize({sort_ignore_case: true})
        .then(() => {
          const result = tagcloud();

          expect(result).to.be.eql([
            '<a href="/tags/Bar/" style="font-size: 10px;">Bar</a>',
            '<a href="/tags/baz/" style="font-size: 20px;">baz</a>',
            '<a href="/tags/FOO/" style="font-size: 15px;">FOO</a>'
          ].join(' '));
        });
    });

    it('sort case sensitive', () => {
      return initialize({sort_ignore_case: false})
        .then(() => {
          const result = tagcloud();

          expect(result).to.be.eql([
            '<a href="/tags/Bar/" style="font-size: 10px;">Bar</a>',
            '<a href="/tags/FOO/" style="font-size: 15px;">FOO</a>',
            '<a href="/tags/baz/" style="font-size: 20px;">baz</a>'
          ].join(' '));
        });
    });
  });

});
