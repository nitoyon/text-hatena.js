text-hatena.js
==============

CPAN で公開されている [Text::Hatena](http://search.cpan.org/dist/Text-Hatena/) を JavaScript に移植したライブラリです。

完全に JavaScript だけで書かれているので、ブラウザだけで「はてな記法」をリアルタイムに HTML に変換できます。


デモ
----

* [はてな記法ワープロ](http://tech.nitoyon.com/javascript/application/texthatena/wordpro/)


使用方法
--------

    var parser = new Hatena();
    parser.parse("*Hello world\n>>\nquote\n<<");
    alert(parser.html());
    // <div class="section">
    //     <a href="#p1" name="p1"><span class="sanchor">o-</span></a> hello</h3>
    //     <p>world</p>
    // </div>"


ライセンス
----------

MIT