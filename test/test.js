test("workaround for grunt qunit failure in Windows", function() {
	expect(0);
	stop();
	setTimeout(function() {
		start();
	}, 13);
});

test( "dl test", function() {
	text_equal(":a:b", [
		"<dl>",
		"\t<dt>a</dt>",
		"\t<dd>b</dd>",
		"</dl>"]);
	text_equal(":a:b:c:d", [
		"<dl>",
		"\t<dt>a</dt>",
		"\t<dd>b:c:d</dd>",
		"</dl>"]);
	text_equal(":a:b\n:c:d", [
		"<dl>",
		"\t<dt>a</dt>",
		"\t<dd>b</dd>",
		"\t<dt>c</dt>",
		"\t<dd>d</dd>",
		"</dl>"]);
});

test( "br test", function() {
	text_equal(["a", "", "b"], [
		"<p>a</p>",
		"",
		"<p>b</p>"]);
	text_equal(["a", "", "", "b"], [
		"<p>a</p>",
		"",
		"<br>",
		"<p>b</p>"]);
	text_equal(["a", "", "", "", "b"], [
		"<p>a</p>",
		"",
		"<br>",
		"<br>",
		"<p>b</p>"]);
});

test( "footnote test", function() {
	text_equal("foo((bar))baz", 
		'<p>foo<span class="footnote"><a href="#f1" title="bar" name="fn1">*1</a></span>baz</p>',
		'<p class="footnote"><a href="#fn1" name="f1">*1</a>: bar</p>');
	text_equal("foo((bar))ba((z))", 
		'<p>foo<span class="footnote"><a href="#f1" title="bar" name="fn1">*1</a></span>ba<span class="footnote"><a href="#f2" title="z" name="fn2">*2</a></span></p>',
		['<p class="footnote"><a href="#fn1" name="f1">*1</a>: bar</p>',
		'<p class="footnote"><a href="#fn2" name="f2">*2</a>: z</p>']);
  text_equal(["foo((bar", "baz))hoge"], ['<p>foo((bar</p>','<p>baz))hoge</p>']);
  text_equal("foo(((bar)))baz", '<p>foo(((bar)))baz</p>');
  text_equal("foo)((bar))(baz", '<p>foo((bar))baz</p>');
});

test( "h3 test", function() {
	text_equal("*title", 
		'<h3><a href="#p1" name="p1"><span class="sanchor">o-</span></a> title</h3>');
	text_equal("*title1\n*title2", [
		'<h3><a href="#p1" name="p1"><span class="sanchor">o-</span></a> title1</h3>',
		'<h3><a href="#p2" name="p2"><span class="sanchor">o-</span></a> title2</h3>']);
});

test( "h4 test", function() {
	text_equal("**title", '<h4>title</h4>');
});

test( "h5 test", function() {
	text_equal("***title", '<h5>title</h5>');
});

test( "list test", function() {
	text_equal("-a", [
		'<ul>',
		'\t<li>a</li>',
		'</ul>']);
	text_equal("+a", [
		'<ol>',
		'\t<li>a</li>',
		'</ol>']);
	text_equal("-a\n-b", [
		'<ul>',
		'\t<li>a</li>',
		'\t<li>b</li>',
		'</ul>']);
	text_equal("-a\n--b", [
		'<ul>',
		'\t<li>a',
		'\t<ul>',
		'\t\t<li>b</li>',
		'\t</ul>',
		'\t</li>',
		'</ul>']);
	text_equal("-a\n--b\n-c", [
		'<ul>',
		'\t<li>a',
		'\t<ul>',
		'\t\t<li>b</li>',
		'\t</ul>',
		'\t</li>',
		'\t<li>c</li>',
		'</ul>']);
	text_equal("-a\n++b\n-c", [
		'<ul>',
		'\t<li>a',
		'\t<ol>',
		'\t\t<li>b</li>',
		'\t</ol>',
		'\t</li>',
		'\t<li>c</li>',
		'</ul>']);
	text_equal("-a\n\n-b", [
		'<ul>',
		'\t<li>a</li>',
		'</ul>',
		'',
		'<ul>',
		'\t<li>b</li>',
		'</ul>']);
});

test( "p test", function() {
	text_equal("a", "<p>a</p>");
	text_equal(["a", "b"], [
		'<p>a</p>',
		'<p>b</p>']);
	text_equal(["a", "", "b"], [
		'<p>a</p>',
		'',
		'<p>b</p>']);
});

test( "pre test", function() {
	text_equal([">|", "a", "|<"], '<pre>\na\n</pre>');
	text_equal([">|", "a|<"], '<pre>\na</pre>');
	text_equal([">|", "a", "  b", "|<"], '<pre>\na\n  b\n</pre>');
	text_equal([">|", '<a href="#">a</a>', "|<"], '<pre>\n<a href="#">a</a>\n</pre>');
});

test( "super pre test", function() {
	text_equal([">||", "a", "||<"], '<pre>\na\n</pre>');
	text_equal([">||", "a < 3", "||<"], '<pre>\na &lt; 3\n</pre>');
	text_equal([">||", "a", "", "b", "||<"], '<pre>\na\n\nb\n</pre>');
	text_equal([">|javascript|", "a", "||<"], '<pre class="syntax-highlight prettyprint lang-javascript">\na\n</pre>');
	text_equal([">|aa|", "art", "||<"], '<pre class="ascii-art">\nart\n</pre>');
});

test( "table test", function() {
	text_equal("|a|b|", [
		'<table>',
		'\t<tr>',
		'\t\t<td>a</td>',
		'\t\t<td>b</td>',
		'\t</tr>',
		'</table>']);
	text_equal("|a|b|\n|c|d|", [
		'<table>',
		'\t<tr>',
		'\t\t<td>a</td>',
		'\t\t<td>b</td>',
		'\t</tr>',
		'\t<tr>',
		'\t\t<td>c</td>',
		'\t\t<td>d</td>',
		'\t</tr>',
		'</table>']);
	text_equal("|*a|b|", [
		'<table>',
		'\t<tr>',
		'\t\t<th>a</th>',
		'\t\t<td>b</td>',
		'\t</tr>',
		'</table>']);
});

test( "blockquote test", function() {
	text_equal([">>", "a", "<<"], [
		"<blockquote>",
		'\t<p>a</p>',
		"</blockquote>"]);
	text_equal([">>", "**a", "<<"], [
		"<blockquote>",
		'\t<h4>a</h4>',
		"</blockquote>"]);
	text_equal([">>", "a", "b", "<<"], [
		"<blockquote>",
		'\t<p>a</p>',
		'\t<p>b</p>',
		"</blockquote>"]);
	text_equal([">>", "a", ">>", "b", "<<", "<<"], [
		"<blockquote>",
		'\t<p>a</p>',
		'\t<blockquote>',
		'\t\t<p>b</p>',
		'\t</blockquote>',
		"</blockquote>"]);
	text_equal([">http://example.com>", "a", "<<"], [
		'<blockquote cite="http://example.com" title="http://example.com">',
		'\t<p>a</p>',
		'\t<cite><a href="http://example.com">http://example.com</a></cite>',
		'</blockquote>']);
	text_equal([">http://example.com:title=example>", "a", "<<"], [
		'<blockquote cite="http://example.com" title="example">',
		'\t<p>a</p>',
		'\t<cite><a href="http://example.com">example</a></cite>',
		'</blockquote>']);
});

test( "tag node test", function() {
	text_equal(["><center>", "test", "</center><"], 
		["<center>", "\ttest", "</center>"]);
	text_equal(["><center>", "**test", "</center><"], 
		["<center>", "\t<h4>test</h4>", "</center>"]);
});

test( "tag line node test", function() {
	text_equal("><center>test</center><", "<center>test</center>");
});


function text_equal(source, expected, footnotes) {
	source = arg_to_string(source);
	expected = "<div class=\"section\">\n" + arg_to_string(expected, 1) + "\n</div>";
	if (footnotes) {
		expected += '\n<div class="footnote">\n' + arg_to_string(footnotes, 1) + "\n</div>\n";
	}

	equal(new TextHatena().parse(source), expected, 
		source.replace(/\n/g, "\\n"));
}

function arg_to_string(arg, indent) {
	var lines;
	if (typeof(arg) == "string") {
		lines = [arg];
	} else if (arg instanceof Array) {
		lines = arg;
	} else {
		throw "invalid expected value: " + arg;
	}

	var t = "";
	for (var i = 0; i < indent || 0; i++) {
		t += "\t";
	}

	for (i = 0; i < lines.length; i++) {
		lines[i] = t + lines[i];
	}
	return lines.join("\n");
}
