text-hatena.js
==============

CPAN �Ǹ�������Ƥ��� [Text::Hatena](http://search.cpan.org/dist/Text-Hatena/) �� JavaScript �˰ܿ������饤�֥��Ǥ���

������ JavaScript �����ǽ񤫤�Ƥ���Τǡ��֥饦�������ǡ֤ϤƤʵ�ˡ�פ�ꥢ�륿����� HTML ���Ѵ��Ǥ��ޤ���


�ǥ�
----

* [�ϤƤʵ�ˡ��ץ�](http://tech.nitoyon.com/javascript/application/texthatena/wordpro/)


������ˡ
--------

    var parser = new Hatena();
    parser.parse("*Hello world\n>>\nquote\n<<");
    alert(parser.html());
    // <div class="section">
    //     <a href="#p1" name="p1"><span class="sanchor">o-</span></a> hello</h3>
    //     <p>world</p>
    // </div>"


�饤����
----------

MIT