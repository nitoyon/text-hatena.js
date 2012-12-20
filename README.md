text-hatena.js
==============

CPAN で公開されている [Text::Hatena](http://search.cpan.org/dist/Text-Hatena/) を JavaScript に移植したライブラリです。

完全に JavaScript だけで書かれているので、ブラウザだけで「はてな記法」をリアルタイムに HTML に変換できます。


デモ
----

* [はてな記法ワープロ](http://tech.nitoyon.com/javascript/application/texthatena/wordpro/)


使用方法
--------

    var parser = new TextHatena();
    alert(parser.parse("*Hello\nworld"));
    // <div class="section">
    //     <a href="#p1" name="p1"><span class="sanchor">o-</span></a> hello</h3>
    //     <p>world</p>
    // </div>"


開発
----

grunt を使うことで効率的に開発できる。

  1. node.js をインストール。
  2. `npm install -g grunt` で grunt をインストール。
  3. [PhantomJS](http://phantomjs.org/) をパスが通った場所にインストール。

lint と QUnit によるテストを実行する場合:

    $ grunt

ただし、Windows の場合は `grunt.cmd` を実行する。

テストのみを実行する場合:

    $ grunt qunit

ファイル変更時に自動的に lint とテストを実行する場合:

    $ grunt default watch


ライセンス
----------

MIT