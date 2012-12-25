(function(global) {

var extend = function(destination, source) {
	for (var property in source) {
		destination[property] = source[property];
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
			texthandler : this.texthandler
		});
		var c = this.context;
		var node = new Hatena.BodyNode();
		node._new({
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
			node = new Hatena.FootnoteNode();
			node._new({
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
Hatena.Node = function(){};
Hatena.Node.prototype = {
	_html : "", 
	pattern : "",

	_new : function(args){
		extend(this, {
			context : args.context,
			ilevel : args.ilevel,
			_html : ''
		});
		this.init();
	},
	init : function(){
		this.pattern = '';
	},

	parse : function(){ alert('die'); },

	context : function(v){
		this.context = v;
	}
};


// Hatena::BodyNode
Hatena.BodyNode = function(){};
Hatena.BodyNode.prototype = extend(new Hatena.Node(), {
	parse : function(){
		var c = this.context;
		while (this.context.hasnext()) {
			var node = new Hatena.SectionNode();
			node._new({
				context : c,
				ilevel : this.ilevel
			});
			node.parse();
		}
	}
});


// Hatena::BrNode
Hatena.BrNode = function(){};
Hatena.BrNode.prototype = extend(new Hatena.Node(), {
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
Hatena.CDataNode = function(){};
Hatena.CDataNode.prototype = extend(new Hatena.Node(), {
	parse : function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		var l = c.shiftline();
		var text = new Hatena.Text();
		text._new({context : c});
		text.parse(l);
		l = text.html();
		c.htmllines(t + l);
	}
});


// Hatena::DlNode
Hatena.DlNode = function(){};
Hatena.DlNode.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.pattern = /^\:((?:<[^>]+>|\[\].+?\[\]|\[[^\]]+\]|\[\]|[^\:<\[]+)+)\:(.+)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.nextline();
		if(!l.match(this.pattern)) { return; }
		this.llevel = RegExp.$1.length;
		var t = times("\t", this.ilevel);

		c.htmllines(t + "<dl>");
		while ((l = c.nextline())) {
			if(!l.match(this.pattern)) { break; }
			c.shiftline();
			c.htmllines(t + "\t<dt>" + RegExp.$1 + "</dt>");
			c.htmllines(t + "\t<dd>" + RegExp.$2 + "</dd>");
		}
		c.htmllines(t + "</dl>");
	}
});


// Hatena::FootnoteNode
Hatena.FootnoteNode = function(){};
Hatena.FootnoteNode.prototype = extend(new Hatena.Node(), {
	_html : "",

	parse : function(){
		var c = this.context;
		if(!c.footnotes || c.footnotes.length === 0) { return; }
		var t = times("\t", this.ilevel);
		var p = c.permalink;
		this._html = '';

		this._html += t + '<div class="footnote">\n';
		var num = 0;
		var text = new Hatena.Text();
		text._new({context : c});
		for(var i = 0; i < c.footnotes.length; i++) {
			var note = c.footnotes[i];
			num++;
			text.parse(note);
			var l = t + '\t<p class="footnote"><a href="' + p + '#fn' + num + '" name="f' + num + '">*' + num + '</a>: ' +
				text.html() + '</p>';
			this._html += l + "\n";
		}
		this._html += t + '</div>\n';
	},

	html : function(){return this._html;}
});


// Hatena::H3Node
Hatena.H3Node = function(){};
Hatena.H3Node.prototype = extend(new Hatena.Node(), {
	init : function(){
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
Hatena.H4Node = function(){};
Hatena.H4Node.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.pattern = /^\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.shiftline();
		if(!l) { return; }
		if(!l.match(this.pattern)) { return; }
		var t = times("\t", this.ilevel);
		c.htmllines(t + "<h4>" + RegExp.$1 + "</h4>");
	}
});


// Hatena::H5Node
Hatena.H5Node = function(){};
Hatena.H5Node.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.pattern = /^\*\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.context;
		var l = c.shiftline();
		if(!l) { return; }
		if(!l.match(this.pattern)) { return; }
		var t = times("\t", this.ilevel);
		c.htmllines(t + "<h5>" + RegExp.$1 + "</h5>");
	}
});


// Hatena::ListNode
Hatena.ListNode = function(){};
Hatena.ListNode.prototype = extend(new Hatena.Node(), {
	init : function(){
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
					c.htmllines(t + "\t<li>" + text + "</li>");
				}
				break;
			}
			var newtext = RegExp.$2;

			if (RegExp.$1.length > this.llevel) {
				c.htmllines(t + "\t<li>" + text);
				var node = new Hatena.ListNode();
				node._new({
					context : this.context,
					ilevel : this.ilevel
				});
				node.parse();
				c.htmllines(t + "\t</li>");
				text = null;
			} else if(RegExp.$1.length < this.llevel) {
				c.htmllines(t + "\t<li>" + text + "</li>");
				break;
			} else {
				if (text) {
					c.htmllines(t + "\t<li>" + text + "</li>");
				}
				text = newtext;
				c.shiftline();
			}
		}
		c.htmllines(t + "</" + this.type + ">");
	}
});


// Hatena::PNode
Hatena.PNode = function(){};
Hatena.PNode.prototype = extend(new Hatena.Node(), {
	parse :function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		var l = c.shiftline();
		var text = new Hatena.Text();
		text._new({context : c});
		text.parse(l);
		l = text.html();
		c.htmllines(t + "<p>" + l + "</p>");
	}
});


// Hatena::PreNode
Hatena.PreNode = function(){};
Hatena.PreNode.prototype = extend(new Hatena.Node(), {
	init :function(){
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
				x = RegExp.$1;
				c.shiftline();
				break;
			}
			c.htmllines(this.escape_pre(c.shiftline()));
		}
		c.htmllines(x + this.endstring);
	},

	escape_pre : function(text){ return text; }
});


// Hatena::SuperpreNode
Hatena.SuperpreNode = function(){};
Hatena.SuperpreNode.prototype = extend(new Hatena.PreNode(), {
	init : function(){
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
Hatena.TableNode = function(){};
Hatena.TableNode.prototype = extend(new Hatena.Node(), {
	init : function(){
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
					c.htmllines(t + "\t\t<th>" + RegExp.$1 + "</th>");
				} else {
					c.htmllines(t + "\t\t<td>" + item + "</td>");
				}
			}
			c.htmllines(t + "\t</tr>");
		}
		c.htmllines(t + "</table>");
	}
});


// Hatena::Section
Hatena.SectionNode = function(){};
Hatena.SectionNode.prototype = extend(new Hatena.Node(), {
	init : function(){
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
		var invalid = [];
		if(c.invalidnode) { invalid[c.invalidnode] = []; }
		for(var i = 0; i <  this.childnode.length; i++) {
			var node = this.childnode[i];
			if(invalid[node]) { continue; }
			var Module = Hatena[node.charAt(0).toUpperCase() + node.substr(1).toLowerCase() + 'Node'];
			var n = new Module();
			n._new(nodeoption);
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
			node._new(nodeoption);
			return node;
		} else if (this.context.noparagraph()) {
			node = new Hatena.CDataNode();
			node._new(nodeoption);
			return node;
		} else {
			node = new Hatena.PNode();
			node._new(nodeoption);
			return node;
		}
	}
});


// Hatena::BrockquoteNode
Hatena.BlockquoteNode = function(){};
Hatena.BlockquoteNode.prototype = extend(new Hatena.SectionNode(), {
	init : function(){
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
Hatena.TagNode = function(){};
Hatena.TagNode.prototype = extend(new Hatena.SectionNode(), {
	init : function(){
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
		var text = new Hatena.Text();
		text._new({context : this.context});
		text.parse(l);
		return text.html();
	}
});


// Hatena::TaglineNode
Hatena.TaglineNode = function(){};
Hatena.TaglineNode.prototype = extend(new Hatena.SectionNode(), {
	init : function(){
		this.pattern = /^>(<.*>)<$/;
		this.child_node_refs = [];
	},

	parse : function(){
		var c = this.context;
		var t = times("\t", this.ilevel);
		if(!c.nextline().match(this.pattern)) { return; }
		c.shiftline();
		c.htmllines(t + RegExp.$1);
	}
});


// Hatena::Text
Hatena.Text = function(){};
Hatena.Text.prototype = {
	_new : function(args){
		extend(this, {
			context : args.context,
			_html : ''
		});
	},

	parse : function(text){
		this._html = '';
		if(!text) { return; }
		this._html = text;
	},

	html : function(){return this._html;}
};


// Hatena クラスを TextHatena として公開
global.TextHatena = Hatena;

// 後方互換のために Hatena としても公開
// 将来的に削除する可能性があるので今後の利用は非推奨とする
if (typeof global.Hatena == "undefined") {
	global.Hatena = Hatena;
}

})(this);
