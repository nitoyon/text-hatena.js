(function(global) {

var extend = function(destination, source1, source2) {
	for (var i = 0; i < 2; i++) {
		var source = [source1, source2][i];
		if (source !== undefined) {
			for (var property in source) {
				destination[property] = source[property];
			}
		}
	}
	return destination;
};

var times = function(str, time){
	var s = "";
	for(var i = 0; i < time; i++) {
		s += "\t";
	}
	return s;
};

var escapeHTML = function(s){
	s = s.replace(/\&/g, "&amp;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;");
	s = s.replace(/\'/g, "&#39");
	s = s.replace(/\\/g, "&#92");
	return s;
};

// Hatena
var Hatena = function(args){
	if (!args) { args = {}; }
	extend(this, {
		_html : '',
		baseuri : args.baseuri,
		permalink : args.permalink || "",
		categorylinkformat: (args.baseuri || "") + (args.categorylinkformat || "searchdiary?word=*[%s]"),
		ilevel : args.ilevel || 0,
		invalidnode : args.invalidnode || [],
		sectionanchor : args.sectionanchor || 'o-',
		linktarget : args.linktarget || '_blank',
		texthandler : args.texthandler || function(text, c){
			// footnote
			var html = text.replace(/(.)?\(\(([^(].*?)\)\)(.)?/g, function(all, first, note, end){
				if (first === "(" && end === ")") {
					return all;
				} else if (first === ")" && end === "(") {
					return "((" + note + "))";
				}
				var num = c.footnotes.push(note);
				note = note.replace(/<.*?>/g, "").replace(/&/g, "&amp;");
				return first + '<span class="footnote"><a href="' + c.permalink + '#f' + num + '" title="' + note + '" name="fn' + num + '">*' + num + '</a></span>' + end;
			});
			return html;
		}
	});
};
Hatena.prototype = {
	parse : function(text){
		this.context = new Hatena.Context({
			text : text || "",
			baseuri : this.baseuri,
			permalink : this.permalink,
			categorylinkformat: this.categorylinkformat,
			invalidnode : this.invalidnode,
			sectionanchor : this.sectionanchor,
			linktarget : this.linktarget,
			texthandler : this.texthandler
		});
		var c = this.context;
		var node = new Hatena.BodyNode({
			context : c,
			ilevel : this.ilevel
		});
		node.parse();
		var parser = new Hatena.HTMLFilter({
			context : c
		});
		parser.parse(c.html());
		this._html = parser.html();

		if (this.context.footnotes.length !== 0) {
			node = new Hatena.FootnoteNode({
				context : this.context,
				ilevel : this.ilevel
			});
			node.parse();
			this._html += "\n";
			this._html += node.html();
		}
		return this._html;
	}, 

	html : function(){
		return this._html;
	}
};


// Hatena::Hatena.HTMLFilter
Hatena.HTMLFilter = function(args){
	extend(this, {
		context : args.context,
		_html : ''
	});
	this.init();
};
Hatena.HTMLFilter.prototype = {
	init :function(){
		// HTML::Parser を利用すべきなんだけど JavaScript ではなんとも...
	},

	parse : function(html){
		var c = this.context;
		this._html = c.texthandler(html, c);
	},

	html : function(){
		return this._html;
	}
};

// Hatena::Context
Hatena.Context = function(args){
	extend(this, {
		text : args.text,
		baseuri : args.baseuri,
		permalink : args.permalink,
		categorylinkformat: args.categorylinkformat,
		invalidnode : args.invalidnode,
		sectionanchor : args.sectionanchor,
		linktarget : args.linktarget,
		texthandler : args.texthandler,
		_htmllines : [],
		footnotes : [],
		sectioncount : 0,
		syntaxrefs : [],
		_noparagraph : 0
	});
	this.init();
};

Hatena.Context.prototype = {
	init : function() {
		this.text = this.text.replace(/\r/g, "");
		this.lines = this.text.split('\n');
		this.index = -1;
	},

	hasnext : function() {
		return (this.lines && this.lines.length - 1 > this.index);
	},

	nextline : function() {
		return this.lines[this.index + 1];
	},

	shiftline : function() {
		return this.lines[++this.index];
	},

	currentline : function() {
		return this.lines[this.index];
	},

	html : function() {
		return this._htmllines.join ("\n");
	},

	htmllines : function(line) {
		if(typeof line != "undefined") {
			this._htmllines.push(line);
		}
		return this._htmllines;
	},

	lasthtmlline : function() {return this._htmllines[this._htmllines.length - 1]; },

	syntaxrefs : function(line) {
		if(typeof line != "undefined") { this.syntaxrefs.push(line); }
		return this.syntaxrefs;
	},

	syntaxpattern : function(pattern) {
		if(typeof pattern != "undefined") { this.syntaxpattern = pattern; }
		return this.syntaxpattern;
	},

	noparagraph : function(noparagraph) {
		if(typeof noparagraph != "undefined") { this._noparagraph = noparagraph; }
		return this._noparagraph;
	},

	incrementsection : function() {
		return this.sectioncount++;
	}
};


// Hatena::Node
Hatena.Node = function(args){ this.init(args); };
Hatena.Node.prototype = {
	_html : "", 
	pattern : "",

	init : function(args){
		extend(this, {
			context : args.context,
			ilevel : args.ilevel,
			_html : '',
			pattern: ''
		});
	},

	parse : function(){ alert('die'); },

	context : function(v){
		this.context = v;
	}
};


// Hatena::BodyNode
Hatena.BodyNode = function(args){ this.init(args); };
Hatena.BodyNode.prototype = extend({}, Hatena.Node.prototype, {
	parse : function(){
		var c = this.context;
		while (this.context.hasnext()) {
			var node = new Hatena.SectionNode({
				context : c,
				ilevel : this.ilevel
			});
			node.parse();
		}
	}
});


// Hatena::BrNode
Hatena.BrNode = function(args){ this.init(args); };
Hatena.BrNode.prototype = extend({}, Hatena.Node.prototype, {
	parse : function(){
		var c = this.context;
		var l = c.shiftline();
		if(l.length !== 0) { return; }
		var t = times("\t", this.ilevel);
		if (c.lasthtmlline() == t + "<br>" || c.lasthtmlline() == t) {
			c.htmllines(t + "<br>");
		} else {
			c.htmllines(t);
		}
	}
});


// Hatena::CDataNode
Hatena.CDataNode = function(args){ this.init(args); };
Hatena.CDataNode.prototype = extend({}, Hatena.Node.prototype, {
	parse : function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		var l = c.shiftline();
		var text = new Hatena.Text({context : c});
		text.parse(l);
		l = text.html();
		c.htmllines(t + l);
	}
});


// Hatena::DlNode
Hatena.DlNode = function(args){ this.init(args); };
Hatena.DlNode.prototype = extend({}, Hatena.Node.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^\:((?:<[^>]+>|\[\].+?\[\]|\[[^\]]+\]|\[\]|[^\:<\[]+)+)\:(.+)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.nextline();
		if(!l.match(this.pattern)) { return; }
		this.llevel = RegExp.$1.length;
		var t = times("\t", this.ilevel);

		c.htmllines(t + "<dl>");
		var m;
		while ((l = c.nextline())) {
			m = l.match(this.pattern);
			if (!m) {
				break;
			}
			c.shiftline();
			c.htmllines(t + "\t<dt>" + Hatena.AutoLink(m[1], c) + "</dt>");
			c.htmllines(t + "\t<dd>" + Hatena.AutoLink(m[2], c) + "</dd>");
		}
		c.htmllines(t + "</dl>");
	}
});


// Hatena::FootnoteNode
Hatena.FootnoteNode = function(args){ this.init(args); };
Hatena.FootnoteNode.prototype = extend({}, Hatena.Node.prototype, {
	_html : "",

	parse : function(){
		var c = this.context;
		if(!c.footnotes || c.footnotes.length === 0) { return; }
		var t = times("\t", this.ilevel);
		var p = c.permalink;
		this._html = '';

		this._html += t + '<div class="footnote">\n';
		var num = 0;
		var text = new Hatena.Text({context : c});
		for(var i = 0; i < c.footnotes.length; i++) {
			var note = c.footnotes[i];
			num++;
			text.parse(Hatena.AutoLink(note, c));
			var l = t + '\t<p class="footnote"><a href="' + p + '#fn' + num + '" name="f' + num + '">*' + num + '</a>: ' +
				text.html() + '</p>';
			this._html += l + "\n";
		}
		this._html += t + '</div>\n';
	},

	html : function(){return this._html;}
});


// Hatena::H3Node
Hatena.H3Node = function(args){ this.init(args); };
Hatena.H3Node.prototype = extend({}, Hatena.Node.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^\*(?:(\d{9,10}|[a-zA-Z]\w*)\*)?((?:\[[^\:\[\]]+\])+)?(.*)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.shiftline();
		if(!l) { return; }
		if(!l.match(this.pattern)) { return; }
		var name = RegExp.$1;
		var cat = RegExp.$2;
		var title = RegExp.$3;
		var p = c.permalink;
		var t = times("\t", this.ilevel);
		var sa = c.sectionanchor;

		if (cat) {
			cat = this._formatcategory(cat);
		}
		var extra = '';
		var ret = this._formatname(name);
		var num = (typeof ret[0] != "undefined" ? ret[0] : "");
		extra = (typeof ret[1] != "undefined" ? ret[1] : "");
		c.htmllines(t + '<h3><a href="' + p + '#' + num + '" name="' + num + '"><span class="sanchor">' + sa + '</span></a> ' + cat + title + '</h3>' + extra);
	},

  _formatcategory : function(cat) {
		var res = "";
		var category;
		var categories = cat.substr(1, cat.length - 2).split("][");
		for (var i = 0, len = categories.length; i < len; ++i) {
			category = categories[i];
			res += '[<a class="sectioncategory" href="' +
				this.context.categorylinkformat.replace(/%s/g, encodeURIComponent(category)) + '">' +
				escapeHTML(category) + '</a>]';
		}
		return res;
  },

	_formatname : function(name){
		/* TODO: 時間も未対応。表示時の時間が表示されてしまう...
		if (name && name.match(/^\d{9,10}$/)) {
			var m = sprintf('%02d', (localtime($name))[1]);
			var h = sprintf('%02d', (localtime($name))[2]);
			return (
				$name,
				qq| <span class="timestamp">$h:$m</span>|,
			);
		} elsif ($name) {*/
		if(name !== ""){
			return [name];
		} else {
			this.context.incrementsection();
			name = 'p' + this.context.sectioncount;
			return [name];
		}
	}
});


// Hatena::H4Node
Hatena.H4Node = function(args){ this.init(args); };
Hatena.H4Node.prototype = extend({}, Hatena.Node.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.shiftline();
		if(!l) { return; }
		if(!l.match(this.pattern)) { return; }
		var t = times("\t", this.ilevel);
		c.htmllines(t + "<h4>" + Hatena.AutoLink(RegExp.$1, c) + "</h4>");
	}
});


// Hatena::H5Node
Hatena.H5Node = function(args){ this.init(args); };
Hatena.H5Node.prototype = extend({}, Hatena.Node.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^\*\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.shiftline();
		if(!l) { return; }
		if(!l.match(this.pattern)) { return; }
		var t = times("\t", this.ilevel);
		c.htmllines(t + "<h5>" + Hatena.AutoLink(RegExp.$1, c) + "</h5>");
	}
});


// Hatena::ListNode
Hatena.ListNode = function(args){ this.init(args); };
Hatena.ListNode.prototype = extend({}, Hatena.Node.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^([\-\+]+)([^>\-\+].*)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.nextline();
		if(!l.match(this.pattern)) { return; }
		this.llevel = RegExp.$1.length;
		var t = times("\t", this.ilevel + this.llevel - 1);
		var text = RegExp.$2;
		this.type = RegExp.$1.substr(0, 1) == '-' ? 'ul' : 'ol';

		c.htmllines(t + "<" + this.type + ">");
		c.shiftline();

		while (true) {
			l = c.nextline();
			if(!l || !l.match(this.pattern)) {
				if (text) {
					c.htmllines(t + "\t<li>" + Hatena.AutoLink(text, c) + "</li>");
				}
				break;
			}
			var newtext = RegExp.$2;

			if (RegExp.$1.length > this.llevel) {
				c.htmllines(t + "\t<li>" + Hatena.AutoLink(text, c));
				var node = new Hatena.ListNode({
					context : this.context,
					ilevel : this.ilevel
				});
				node.parse();
				c.htmllines(t + "\t</li>");
				text = null;
			} else if(RegExp.$1.length < this.llevel) {
				c.htmllines(t + "\t<li>" + Hatena.AutoLink(text, c) + "</li>");
				break;
			} else {
				if (text) {
					c.htmllines(t + "\t<li>" + Hatena.AutoLink(text, c) + "</li>");
				}
				text = newtext;
				c.shiftline();
			}
		}
		c.htmllines(t + "</" + this.type + ">");
	}
});


// Hatena::PNode
Hatena.PNode = function(args){ this.init(args); };
Hatena.PNode.prototype = extend({}, Hatena.Node.prototype, {
	parse :function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		var l = c.shiftline();
		var text = new Hatena.Text({context : c});
		text.parse(Hatena.AutoLink(l, c));
		l = text.html();
		c.htmllines(t + "<p>" + l + "</p>");
	}
});


// Hatena::PreNode
Hatena.PreNode = function(args) { this.init(args); };
Hatena.PreNode.prototype = extend({}, Hatena.Node.prototype, {
	init :function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^>\|$/;
		this.endpattern = /(.*)\|<$/;
		this.startstring = "<pre>";
		this.endstring = "</pre>";
	},

	parse : function(){
		var c = this.context;
		if(!c.nextline().match(this.pattern)) { return; }
		c.shiftline();
		var t = times("\t", this.ilevel);
		c.htmllines(t + this.startstring);
		this.parseContents();
	},

	parseContents : function(){
		var c = this.context;
		var x = '';
		while (c.hasnext()) {
			var l = c.nextline();
			if (l.match(this.endpattern)) {
				x = Hatena.AutoLink(RegExp.$1, c);
				c.shiftline();
				break;
			}
			c.htmllines(this.escape_pre(c.shiftline()));
		}
		c.htmllines(x + this.endstring);
	},

	escape_pre : function(text){ return Hatena.AutoLink(text, this.context); }
});


// Hatena::SuperpreNode
Hatena.SuperpreNode = function(args){ this.init(args); };
Hatena.SuperpreNode.prototype = extend({}, Hatena.PreNode.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^>\|(\w+)?\|$/;
		this.endpattern = /^\|\|<$/;
		this.startstring = "<pre>";
		this.endstring = "</pre>";
	},

	parse : function(){
		var c = this.context;
		var m = c.nextline().match(this.pattern);
		if (!m) {
			return;
		}
		c.shiftline();
		var t = times("\t", this.ilevel);
		if (m[1]) {
			var _class = m[1] === "aa" ? "ascii-art" : "syntax-highlight prettyprint lang-" + m[1];
			c.htmllines(t + '<pre class="' + _class + '">');
		} else {
			c.htmllines(t + '<pre>');
		}
		this.parseContents();
	},

	escape_pre : function(s){
		return escapeHTML(s);
	}
});


// Hatena::TableNode
Hatena.TableNode = function(args){ this.init(args); };
Hatena.TableNode.prototype = extend({}, Hatena.Node.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.pattern = /^\|([^\|]*\|(?:[^\|]*\|)+)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.nextline();
		if(!l.match(this.pattern)) { return; }
		var t = times("\t", this.ilevel);

		c.htmllines(t + "<table>");
		while ((l = c.nextline())) {
			if(!l.match(this.pattern)) { break; }
			l = c.shiftline();
			c.htmllines(t + "\t<tr>");
			var td = l.split("|");
			td.pop(); td.shift();
			for (var i = 0; i < td.length; i++) {
				var item = td[i];
				if (item.match(/^\*(.*)/)) {
					c.htmllines(t + "\t\t<th>" + Hatena.AutoLink(RegExp.$1, c) + "</th>");
				} else {
					c.htmllines(t + "\t\t<td>" + Hatena.AutoLink(item, c) + "</td>");
				}
			}
			c.htmllines(t + "\t</tr>");
		}
		c.htmllines(t + "</table>");
	}
});


// Hatena::Section
Hatena.SectionNode = function(args){ this.init(args); };
Hatena.SectionNode.prototype = extend({}, Hatena.Node.prototype, {
	init : function(args){
		Hatena.Node.prototype.init.call(this, args);
		this.childnode = ["h5", "h4", "h3", "blockquote", "dl", "list", "pre", "superpre", "table", "tagline", "tag"];
		this.startstring = '<div class="section">';
		this.endstring = '</div>';
		this.child_node_refs = [];
	},

	parse : function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		this._set_child_node_refs();
		c.htmllines(t + this.startstring);
		while (c.hasnext()) {
			var l = c.nextline();
			var node = this._findnode(l);
			if(!node) { return; }
			// TODO: ref == instanceof ???
			//if (ref(node) eq 'Hatena.H3Node') {
			//	if(this.started++) { break; }
			//}
			node.parse();
		}
		c.htmllines(t + this.endstring);
	},

	_set_child_node_refs : function(){
		var c = this.context;
		var nodeoption = {
			context : c,
			ilevel : this.ilevel + 1
		};
		var invalid = {};
		for (var i = 0; i < c.invalidnode.length; i++) {
			invalid[c.invalidnode[i]] = 1;
		}
		for(i = 0; i <  this.childnode.length; i++) {
			var node = this.childnode[i];
			if(invalid[node]) { continue; }
			var Module = Hatena[node.charAt(0).toUpperCase() + node.substr(1).toLowerCase() + 'Node'];
			var n = new Module(nodeoption);
			this.child_node_refs.push(n);
		}
	},

	_findnode : function(l){
		var node;
		for(var i = 0; i < this.child_node_refs.length; i++) {
			node = this.child_node_refs[i];
			var pat = node.pattern;
			if(!pat) { continue; }
			if (l.match(pat)) {
				return node;
			}
		}
		var nodeoption = {
			context : this.context,
			ilevel : this.ilevel + 1
		};
		if (l.length === 0) {
			node = new Hatena.BrNode(nodeoption);
			return node;
		} else if (this.context.noparagraph()) {
			node = new Hatena.CDataNode(nodeoption);
			return node;
		} else {
			node = new Hatena.PNode(nodeoption);
			return node;
		}
	}
});


// Hatena::BrockquoteNode
Hatena.BlockquoteNode = function(args){ this.init(args); };
Hatena.BlockquoteNode.prototype = extend({}, Hatena.SectionNode.prototype, {
	init : function(args){
		Hatena.SectionNode.prototype.init.call(this, args);
		this.pattern = /^>(?:(https?:\/\/[A-Za-z0-9~\/._\?\&=\-%#\+:\;,\@\']+?)(?::title=([^\]]+))?)?>$/;
		this.endpattern = /^<<$/;
		this.childnode = ["h4", "h5", "blockquote", "dl", "list", "pre", "superpre", "table"];//, "tagline", "tag"];
		this.child_node_refs = [];
	},

	parse : function(){
		var c = this.context;
		var m = c.nextline().match(this.pattern);
		if(!m) {
			return;
		}
		c.shiftline();

		var cite = m[1] || "";
		var title = m[2] || cite;
		var t = times("\t", this.ilevel);
		this._set_child_node_refs();
		c.htmllines(t + '<blockquote' + (cite ? ' cite="' + cite + '" title="' + title + '"' : "") + '>');

		while (c.hasnext()) {
			var l = c.nextline();
			if (l.match(this.endpattern)) {
				c.shiftline();
				break;
			}
			var node = this._findnode(l);
			if(!node) { break; }
			node.parse();
		}

		if (cite) {
			c.htmllines(t + '\t<cite><a href="' + cite + '">' + title + '</a></cite>');
		}
		c.htmllines(t + '</blockquote>');
	}
});


// Hatena::TagNode
Hatena.TagNode = function(args){ this.init(args); };
Hatena.TagNode.prototype = extend({}, Hatena.SectionNode.prototype, {
	init : function(args){
		Hatena.SectionNode.prototype.init.call(this, args);
		this.pattern = /^>(<.*)$/;
		this.endpattern = /^(.*>)<$/;
		this.childnode = ["h4", "h5", "blockquote", "dl", "list", "pre", "superpre", "table"];
		this.child_node_refs = [];
	},

	parse : function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		if(!c.nextline().match(this.pattern)) { return; }
		c.shiftline();
		c.noparagraph(1);
		this._set_child_node_refs();
		var x =this._parse_text(RegExp.$1);
		c.htmllines(t + x);
		while (c.hasnext()) {
			var l = c.nextline();
			if (l.match(this.endpattern)) {
				c.shiftline();
				x = this._parse_text(RegExp.$1);
				c.htmllines(t + x);
				break;
			}
			var node = this._findnode(l);
			if(!node) { break; }
			node.parse();
		}
		c.noparagraph(0);
	},

	_parse_text : function(l){
		var text = new Hatena.Text({context : this.context});
		text.parse(l);
		return text.html();
	}
});


// Hatena::TaglineNode
Hatena.TaglineNode = function(args){ this.init(args); };
Hatena.TaglineNode.prototype = extend({}, Hatena.SectionNode.prototype, {
	init : function(args){
		Hatena.SectionNode.prototype.init.call(this, args);
		this.pattern = /^>(<.*>)<$/;
		this.child_node_refs = [];
	},

	parse : function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		if(!c.nextline().match(this.pattern)) { return; }
		c.shiftline();
		c.htmllines(t + Hatena.AutoLink(RegExp.$1, c));
	}
});


// Hatena::Text
Hatena.Text = function(args){ this.init(args); };
Hatena.Text.prototype = {
	init : function(args){
		this.context = args.context;
		this._html = '';
	},

	parse : function(text){
		this._html = '';
		if(!text) { return; }
		this._html = text;
	},

	html : function(){return this._html;}
};

// Hatena::AutoLink
Hatena.AutoLink = (function(){
	var hatenaContext = null;
	var inAnchor = false;
	/**
	 * 属性群のオブジェクトを文字列に文字列に変換
	 * XXX: IE8 がプロパティ名の"class"を予約後だと言ってエラーになるので、"_class" とする
	 * @param {Object} attrs
	 *                 { attributeName: attributeValue, ... }
	 * @return {String}
	 */
	var attrToSting = function (attrs) {
		var str = "";
		for (var attrName in attrs) {
			str += ' ' + (attrName === "_class" ? "class" : attrName) + '="' + escapeHTML(attrs[attrName]) + '"';
		}
		return str;
	};
	/**
	 * A 要素の生成
	 * @param {String} url       A.href
	 * @param {String} text      A 要素の内容
	 * @param {Object} attrs
	 * @param {Boolean} isEmail
	 * @return {String}
	 */
	var createLink = function (url, text, attrs, isEmail) {
		if (!attrs) {
			attrs = {};
		}
		if (!isEmail && hatenaContext.linktarget) {
			attrs.target = hatenaContext.linktarget;
		}
		return '<a href="' + url + '"' + attrToSting(attrs) + '>' + text + '</a>';
	};
	var IMAGE_TYPE = {
		NORMAL: 0,
		BOOKMARK: 1,
		SCREENSHOT: 2
	};
	/**
	 * IMG 要素の生成
	 * @param {String} url   画像のURL
	 * @param {String} meta  `:image` 後のメタデータ
	 * @param {Number} type  参照: {@link IMAGE_TYPE}
	 * @return {String}
	 */
	var createImage = function (url, meta, type) {
		var items = (meta || "").split(/\W/);
		var attrs;
		var item;
		switch (type) {
			case IMAGE_TYPE.SCREENSHOT:
				attrs = { _class: "http-screenshot", width: 120, height: 90 };
				for (var i = 0, len = items.length; i < len; ++i) {
					item = items[i];
					if (item === "left" || item === "right") {
						attrs._class += " hatena-image-" + item;
					} else if (item === "large") {
						attrs.width = 200;
						attrs.height = 150;
					} else if (item === "small") {
						attrs.width = 80;
						attrs.height = 60;
					}
				}
				url = 'http://mozshot.nemui.org/shot/' + attrs.width + 'x' + attrs.height + '?' + encodeURIComponent(url);
				break;
			case IMAGE_TYPE.BOOKMARK:
				attrs = { _class: "http-bookmark" };
				break;
			case IMAGE_TYPE.NORMAL:
			default:
				attrs = { _class: "hatena-image" };
				for (var i = 0, len = items.length; i < len; ++i) {
					item = items[i];
					if (item[0] === "w") {
						attrs.width = item.substr(1);
					} else if (item[0] === "h") {
						attrs.height = item.substr(1);
					} else if (item === "left" || item === "right") {
						attrs._class += " hatena-image-" + item;
					}
				}
		}
		return '<img src="' + url + '"' + attrToSting(attrs) + ' />';
	};
	/**
	 * はてなブックマークカウントの画像を生成
	 * @param {String} url 対象URL
	 * @return {String}
	 */
	var createHatenaBookmarkCountImage = function(url) {
		return createLink("http://b.hatena.ne.jp/entry/" + url,
						createImage("http://b.hatena.ne.jp/entry/image/" + url, "", IMAGE_TYPE.BOOKMARK),
						{ _class: "http-bookmark" });
	};
	/**
	 * @type RegExp
	 *
	 * autoLinker と共に使用する
	 *
	 *  1: (?:<(\/?\w+)[^>]*>) : タグ部分の検出（リンク対象外）
	 *  2: \[\](.+?)\[\]       : 自動リンクの無効化の書式（リンク対象外）
	 *  3: (?:\[([^\]]+)\])    : [....] の自動リンク部分を大まかに検出。
	 *  4: ((?:https?|ftp):\/\/[A-Za-z0-9~\/._\?\&=\-%#\+:\;,\@\']+)
	 *                         : `[...]` に含まれない URL の検出
	 *  5: (mailto:\w[\w\.-]+\@\w[\w\.\-]*\w)
	 *                         : `[...]` に含まれない E-Mail の検出
	 *
	 * @see autoLinker
	 * @see Hatena.AutoLink
	 */
	var linkDetectPattern = /(?:<(\/?\w+)[^>]*>)|\[\](.+?)\[\]|(?:\[([^\]]+)\])|((?:https?|ftp):\/\/[A-Za-z0-9~\/._\?\&=\-%#\+:\;,\@\']+)|(mailto:\w[\w\.-]+\@\w[\w\.\-]*\w)/g;
	/**
	 * String#replace の第2引数となる関数
	 * @param {String} all            検出された部分の全文字列
	 * @param {String|void} tagName   タグ名。A 要素内であるか判定するために
	 * @param {String|void} dontLink  `[]...[]`
	 * @param {String|void} inBracket `[...]` 部分。実際のリンク化は {@link bracketLink} で。
	 * @param {String|void} url       https? または ftp の URL
	 * @param {String|void} email     mailto:... の mail URI
	 *
	 * @return {String} 該当部分の置換結果
	 *
	 * @see linkDetectPattern
	 * @see Hatena.AutoLink
	 */
	var autoLinker = function(all, tagName, dontLink, inBracket, url, email){
		if (tagName) {
			switch (tagName) {
				case "a":
					inAnchor = true;
					break;
				case "/a":
					inAnchor = false;
					break;
			}
			return all;
		} else if (dontLink) {
			return dontLink;
		}
		if (inAnchor) {
			return all;
		} else if (url) {
			return createLink(url, url);
		} else if (email) {
			return createLink(email, email.substr(7), null, true);
		}
		return bracketLink(inBracket);
	};
	var httpNormalPattern = /(:title)(?:=(.*?))?(:bookmark)?$|(:bookmark)(?:(:title)(?:=(.*)))?$/;
	var httpImagePattern = /(\.jpe?g|png|gif|bmp)?:image(?:=(https?:\/\/.+?))?(?::(.*))?$/;
	/**
	 * `[ .... ]` 内をリンクにして返す
	 * @param {String} text
	 * @return {String}
	 *
	 * @see autoLinker
	 */
	var bracketLink = function (text) {
		var t = text.split(":");
		var url;
		var title;
		var query;
		var m;
		switch (t[0]) {
			case "http":
			case "https":
				// 画像リンク
				m = text.match(httpImagePattern);
				if (m) {
					url = text.substr(0, m.index) + m[1];
					if (m[2]) { // 画像へのURLが指定されている場合
						return createLink(url, createImage(m[2], m[3]), { _class: "http-image" });
					} else if (m[1]) { // url が画像である場合
						return createLink(url, createImage(url, m[3]), { _class: "http-image" });
					} else { // それ以外はスクリーンショット
						return createLink(url, createImage(url, m[3], IMAGE_TYPE.SCREENSHOT), { _class: "http-screenshot" });
					}
				}
				// 通常リンク
				m = text.match(httpNormalPattern);
				if (m) {
					url = text.substr(0, m.index);
					if (m[1]) {
						return createLink(url, m[2] ? m[2] : url + ":title") + (m[3] ? createHatenaBookmarkCountImage(url) : "");
					} else if (m[4]) {
						return createHatenaBookmarkCountImage(url) + (m[5] ? createLink(url, m[6] ? m[6] : url + ":title") : "");
					}
					return createLink(url, url);
				}
				// TODO: 動画リンク :movie
				// TODO: 音声リンク :sound
				return createLink(text, text);
			case "ftp":
				return createLink(text, text);
			case "mailto":
				return createLink(text, t.slice(1).join(":"), true)
			case "google":
				switch (t[1]) {
					case "image":
						query = t.slice(2).join(":");
						url = "http://images.google.com/images?q=";
						break;
					case "news":
						query = t.slice(2).join(":");
						url = "https://news.google.com/news?q=";
						break;
					default:
						query = t.slice(1).join(":");
						url = "https://www.google.com/search?q=";
				}
				url += encodeURIComponent(query) + '&ie=utf-8&oe=utf-8';
				return createLink(url, text);
			case "map":
				m = text.match(/^map:x([\d\.]+)y([\d\.]+)/);
				if (m) {
					return createLink("http://map.hatena.ne.jp/?x" + m[1] + "&y" + m[2] + "&z=4", text);
					// TODO: Google Map の表示等
				}
				break;
			case "amazon":
				url = "http://www.amazon.co.jp/exec/obidos/external-search?mode=blended&keyword=" +
							encodeURIComponent(t.slice(1).join(":"));
				return createLink(url, text);
			case "wikipedia":
				var lang = "ja";
				if (/^[a-z]+$/.test(t[1])) {
					lang = t[1];
					query = t.slice(2).join(":");
				} else {
					query = t.slice(1).join(":");
				}
				url = "http://" + lang + ".wikipedia.org/wiki/" + encodeURIComponent(query);
				return createLink(url, text);
		}
		return "[" + text + "]";
	};
	/**
	 * @id Hatena.AutoLink
	 * @param {String} text
	 * @param {Hatena.Context} context
	 */
	var AutoLink = function(text, context){
		if (!text) {
			return "";
		}
		hatenaContext = context;
		inAnchor = 0;
		return text.replace(linkDetectPattern, autoLinker);
	};
	return AutoLink;
}());

// Hatena クラスを TextHatena として公開
global.TextHatena = Hatena;

// 後方互換のために Hatena としても公開
// 将来的に削除する可能性があるので今後の利用は非推奨とする
if (typeof global.Hatena == "undefined") {
	global.Hatena = Hatena;
}

})(this);
