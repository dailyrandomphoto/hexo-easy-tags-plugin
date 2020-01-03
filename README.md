# hexo-easy-tags-plugin

[![NPM Version][npm-version-image]][npm-url]
[![LICENSE][license-image]][license-url]
[![Build Status][travis-image]][travis-url]
[![dependencies Status][dependencies-image]][dependencies-url]
[![devDependencies Status][devDependencies-image]][devDependencies-url]

A Hexo plugin that automatically corrects tag names.

## Why Use This?

We can't remember the case of each tag name used previously. Foo? foo? or FOO?

If you use both `Foo` and `foo`, you will have problems.
- Issue 1: Since the [case-insensitive file system](https://en.wikipedia.org/wiki/Case_preservation) can't create both `/Foo/` and `/foo/` directories, one of them will not accessible.
- Issue 2: If set `filename_case: 1` option on the `_config.yml`, both have slugs as `/foo/`, but `Foo` and `foo` are different tags so only one is created under `/foo/`.

## Solution of This Plugin
This plugin detects before used name and automatically corrects others.

**For example:**

post-A.md
```yaml
tags:
  - Java
  - foo-bar
```
post-B.md
```yaml
tags:
  - java
  - foo_bar
```
post-C.md
```yaml
tags:
  - JAVA
  - foo bar
```

All of the above will be automatically change to
```yaml
tags:
  - Java
  - foo-bar
```
slugs: `/Java/`, `/foo-bar/`

> **NOTE:**<br>
> Depending on the order of processing posts, the tag name can be `java`, `Java` or `JAVA`.


❌ Tags (before)
> JAVA(1), Java(1), foo-bar(1), foo_bar(1), foo bar(1), java(1)

✅ Tags (after)
> Java(3), foo-bar(3)

## Installation

```sh
npm install hexo-easy-tags-plugin
```

## Usages

Just install ths plugin, and run `hexo clean && hexo g`.

### Options

You can add options to the `_config.yml` file.
```yaml
# _config.yml

easy_tags_plugin:
  enable: true
  tag_name_case: 1
  sort_ignore_case: true
```

- `enable` _(default: true)_ - enable this plugin, or disable it.
- `tag_name_case` _(default: 0)_ - option to transform all tags name to lowercase of uppercase. 0 no transform, 1 lowercase, 2 uppercase.
- `sort_ignore_case` _(default: true)_ - if set to `false`, the order of the tags is case sensitive. Affects `list_tags()`, `tagcloud()` helpers.
- `action` _(default: `correct`)_ - if set to `report`, print conflicted tags and exit.

## Release Notes

### 1.1.0
- Add `sort_ignore_case` option to enable case-insensitive sort tags.

### 1.0.2
- Add `action` option to enable reporting conflicts instead of automatic corrections (#3)
- Handle `tag_map` configuration.

## TODO
- Transform tag slugs to lowercase by default. <br>Suggest set `filename_case: 1` in `_config.yml`.
- Transform tag slugs using [transliteration](https://github.com/dzcpy/transliteration) module.


## License
Copyright (c) 2019 [dailyrandomphoto][my-url]. Licensed under the [MIT license][license-url].

[my-url]: https://github.com/dailyrandomphoto
[npm-url]: https://www.npmjs.com/package/hexo-easy-tags-plugin
[travis-url]: https://travis-ci.org/dailyrandomphoto/hexo-easy-tags-plugin
[coveralls-url]: https://coveralls.io/github/dailyrandomphoto/hexo-easy-tags-plugin?branch=master
[license-url]: LICENSE
[dependencies-url]: https://david-dm.org/dailyrandomphoto/hexo-easy-tags-plugin
[devDependencies-url]: https://david-dm.org/dailyrandomphoto/hexo-easy-tags-plugin?type=dev

[npm-downloads-image]: https://img.shields.io/npm/dm/hexo-easy-tags-plugin
[npm-version-image]: https://img.shields.io/npm/v/hexo-easy-tags-plugin
[license-image]: https://img.shields.io/npm/l/hexo-easy-tags-plugin
[travis-image]: https://img.shields.io/travis/dailyrandomphoto/hexo-easy-tags-plugin
[coveralls-image]: https://img.shields.io/coveralls/github/dailyrandomphoto/hexo-easy-tags-plugin
[dependencies-image]: https://img.shields.io/david/dailyrandomphoto/hexo-easy-tags-plugin
[devDependencies-image]: https://img.shields.io/david/dev/dailyrandomphoto/hexo-easy-tags-plugin
