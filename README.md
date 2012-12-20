text-hatena.js
==============

CPAN �Ǹ�������Ƥ��� [Text::Hatena](http://search.cpan.org/dist/Text-Hatena/) �� JavaScript �˰ܿ������饤�֥��Ǥ���

������ JavaScript �����ǽ񤫤�Ƥ���Τǡ��֥饦�������ǡ֤ϤƤʵ�ˡ�פ�ꥢ�륿����� HTML ���Ѵ��Ǥ��ޤ���


�ǥ�
----

* [�ϤƤʵ�ˡ��ץ�](http://tech.nitoyon.com/javascript/application/texthatena/wordpro/)


������ˡ
--------

    var parser = new TextHatena();
    alert(parser.parse("*Hello\nworld"));
    // <div class="section">
    //     <a href="#p1" name="p1"><span class="sanchor">o-</span></a> hello</h3>
    //     <p>world</p>
    // </div>"


��ȯ
----

grunt ��Ȥ����ȤǸ�ΨŪ�˳�ȯ�Ǥ��롣

  1. node.js �򥤥󥹥ȡ��롣
  2. `npm install -g grunt` �� grunt �򥤥󥹥ȡ��롣
  3. [PhantomJS](http://phantomjs.org/) ��ѥ����̤ä����˥��󥹥ȡ��롣

lint �� QUnit �ˤ��ƥ��Ȥ�¹Ԥ�����:

    $ grunt

��������Windows �ξ��� `grunt.cmd` ��¹Ԥ��롣

�ƥ��ȤΤߤ�¹Ԥ�����:

    $ grunt qunit

�ե������ѹ����˼�ưŪ�� lint �ȥƥ��Ȥ�¹Ԥ�����:

    $ grunt default watch


�饤����
----------

MIT