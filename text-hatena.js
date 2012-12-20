(function(global) {

var extend = function(destination, source) {
	for (property in source) {
		destination[property] = source[property];
	}
	return destination;
}

var times = function(str, time){
	var s = "";
	for(var i = 0; i < time; i++)s += "\t";
	return s;
}

var escapeHTML = function(s){
	s = s.replace(/\&/g, "&amp;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;");
	s = s.replace(/\'/g, "&#39");
	s = s.replace(/\\/g, "&#92");
	return s;
}

// Hatena
var Hatena = function(args){
	if(args == null) args = {};
	this.self = {
		html : '',
		baseuri : args["baseuri"],
		permalink : args["permalink"] || "",
		ilevel : args["ilevel"] || 0,
		invalidnode : args["invalidnode"] || [],
		sectionanchor : args["sectionanchor"] || 'o-',
		texthandler : args["texthandler"] || function(text, c){
			// footnote
			var p = c.self.permalink;
			var html = "";
			var foot = text.split("((");
			for(var i = 0; i < foot.length; i++){
				if(i == 0){
					html += foot[i];
					continue;
				}
				var s = foot[i].split("))", 2);
				if(s.length != 2){
					html += "((" + foot[i];
					continue;
				}
				var pre = foot[i - i];
				var note = s[0];
				var post = foot[i].substr(s[0].length + 2);
				if(pre.match(/\)$/) && post.match(/^\(/)){
					html += "((" + post;
				} else {
					var notes = c.footnotes(note);
					var num = notes.length;
					note = note.replace(/<.*?>/g, "");
					note = note.replace(/&/g, "&amp;");
					html += '<span class="footnote"><a href="' + p + '#f' + num + '" title="' + note + '" name="fn' + num + '">*' + num + '</a></span>' + post;
				}
			}
			return html;
		}
	};
}
Hatena.prototype = {
	parse : function(text){
		this.self.context = new Hatena.Context({
			text : text || "",
			baseuri : this.self.baseuri,
			permalink : this.self.permalink,
			invalidnode : this.self.invalidnode,
			sectionanchor : this.self.sectionanchor,
			texthandler : this.self.texthandler
		});
		var c = this.self.context;
		var node = new Hatena.BodyNode();
		node._new({
			context : c,
			ilevel : this.self.ilevel
		});
		node.parse();
		var parser = new Hatena.HTMLFilter({
			context : c
		});
		parser.parse(c.html());
		this.self.html = parser.html();

		if (this.self.context.footnotes().length != 0) {
			var node = new Hatena.FootnoteNode();
			node._new({
				context : this.self.context,
				ilevel : this.self.ilevel
			});
			node.parse();
			this.self.html += "\n";
			this.self.html += node.self.html;
		}
	}, 

	html : function(){
		return this.self.html;
	}
}


// Hatena::Hatena.HTMLFilter
Hatena.HTMLFilter = function(args){
	this.self = {
		context : args["context"],
		html : ''
	};
	this.init();
}
Hatena.HTMLFilter.prototype = {
	init :function(){
		// HTML::Parser を利用すべきなんだけど JavaScript ではなんとも...
	},

	parse : function(html){
		var c = this.self.context;
		this.self.html = c.self.texthandler(html, c);
	},

	html : function(){
		return this.self.html;
	}
}

// Hatena::Context
Hatena.Context = function(args){
	this.self = {
		text : args["text"],
		baseuri : args["baseuri"],
		permalink : args["permalink"],
		invalidnode : args["invalidnode"],
		sectionanchor : args["sectionanchor"],
		texthandler : args["texthandler"],
		_htmllines : [],
		footnotes : Array(),
		sectioncount : 0,
		syntaxrefs : [],
		noparagraph : 0
	};
	this.init();
}

Hatena.Context.prototype = {
	init : function() {
		this.self.text = this.self.text.replace(/\r/g, "");
		this.self.lines = this.self.text.split('\n');
		this.self.index = -1;
	},

	hasnext : function() {
		return (this.self.lines != null && this.self.lines.length - 1 > this.self.index);
	},

	nextline : function() {
		return this.self.lines[this.self.index + 1];
	},

	shiftline : function() {
		return this.self.lines[++this.self.index];
	},

	currentline : function() {
		return this.self.lines[this.self.index];
	},

	html : function() {
		return this.self._htmllines.join ("\n");
	},

	htmllines : function(line) {
		if(line != null) this.self._htmllines.push(line);
		return this.self._htmllines;
	},

	lasthtmlline : function() {return this.self._htmllines[this.self._htmllines.length - 1]; },

	footnotes : function(line) {
		if(line != null) this.self.footnotes.push(line);
		return this.self.footnotes;
	},

	syntaxrefs : function(line) {
		if(line != null) this.self.syntaxrefs.push(line);
		return this.self.syntaxrefs;
	},

	syntaxpattern : function(pattern) {
		if(pattern != null) this.self.syntaxpattern = pattern;
		return this.self.syntaxpattern;
	},

	noparagraph : function(noparagraph) {
		if(noparagraph != null) this.self.noparagraph = noparagraph;
		return this.self.noparagraph;
	},

	incrementsection : function() {
		return this.self.sectioncount++;
	}
}


// Hatena::Node
Hatena.Node = function(){}
Hatena.Node.prototype = {
	html : "", 
	pattern : "",

	_new : function(args){
		if(args == null) args = Array();
		this.self = {
			context : args["context"],
			ilevel : args["ilevel"],
			html : ''
		};
		this.init();
	},
	init : function(){
		this.self.pattern = '';
	},

	parse : function(){ alert('die'); },

	context : function(v){
		this.self.context = v;
	}
};


// Hatena::BodyNode
Hatena.BodyNode = function(){};
Hatena.BodyNode.prototype = extend(new Hatena.Node(), {
	parse : function(){
		var c = this.self.context;
		while (this.self.context.hasnext()) {
			var node = new Hatena.SectionNode();
			node._new({
				context : c,
				ilevel : this.self.ilevel
			});
			node.parse();
		}
	}
})


// Hatena::BrNode
Hatena.BrNode = function(){};
Hatena.BrNode.prototype = extend(new Hatena.Node(), {
	parse : function(){
		var c = this.self.context;
		var l = c.shiftline();
		if(l.length != 0) return;
		var t = times("\t", this.self.ilevel);
		if (c.lasthtmlline() == t + "<br>" || c.lasthtmlline() == t) {
			c.htmllines(t + "<br>");
		} else {
			c.htmllines(t);
		}
	}
})


// Hatena::CDataNode
Hatena.CDataNode = function(){};
Hatena.CDataNode.prototype = extend(new Hatena.Node(), {
	parse : function(){
		var c = this.self.context;
		var t = times("\t", this.self.ilevel);
		var l = c.shiftline();
		var text = new Hatena.Text();
		text._new({context : c});
		text.parse(l);
		l = text.html();
		c.htmllines(t + l);
	}
})


// Hatena::DlNode
Hatena.DlNode = function(){};
Hatena.DlNode.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.self.pattern = /^\:((?:<[^>]+>|\[\].+?\[\]|\[[^\]]+\]|\[\]|[^\:<\[]+)+)\:(.+)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.nextline();
		if(!l.match(this.self.pattern)) return;
		this.self.llevel = RegExp.$1.length;
		var t = times("\t", this.self.ilevel);

		c.htmllines(t + "<dl>");
		while (l = c.nextline()) {
			if(!l.match(this.self.pattern)) break;
			c.shiftline();
			c.htmllines(t + "\t<dt>" + RegExp.$1 + "</dt>");
			c.htmllines(t + "\t<dd>" + RegExp.$2 + "</dd>");
		}
		c.htmllines(t + "</dl>");
	}
})


// Hatena::FootnoteNode
Hatena.FootnoteNode = function(){};
Hatena.FootnoteNode.prototype = extend(new Hatena.Node(), {
	html : "",

	parse : function(){
		var c = this.self["context"];
		if(c.self.footnotes == null || c.self.footnotes.length == 0) return;
		var t = times("\t", this.self["ilevel"]);
		var p = c.self.permalink;
		this.self["html"] = '';

		this.self.html += t + '<div class="footnote">\n';
		var num = 0;
		var text = new Hatena.Text();
		text._new({context : c});
		for(var i = 0; i < c.self.footnotes.length; i++) {
			var note = c.self.footnotes[i];
			num++;
			text.parse(note);
			var l = t + '\t<p class="footnote"><a href="' + p + '#fn' + num + '" name="f' + num + '">*' + num + '</a>: '
				+ text.html() + '</p>';
			this.self["html"] += l + "\n";
		}
		this.self["html"] += t + '</div>\n';
	}
})


// Hatena::H3Node
Hatena.H3Node = function(){};
Hatena.H3Node.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.self.pattern = /^\*(?:(\d{9,10}|[a-zA-Z]\w*)\*)?((?:\[[^\:\[\]]+\])+)?(.*)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.shiftline();
		if(l == null) return;
		if(!l.match(this.self.pattern)) return;
		var name = RegExp.$1;
		var cat = RegExp.$2;
		var title = RegExp.$3;
		var b = c.self.baseuri;
		var p = c.self.permalink;
		var t = times("\t", this.self.ilevel);
		var sa = c.self.sectionanchor;

		/* TODO: カテゴリは未対応
		if (cat) {
			if(cat.match(/\[([^\:\[\]]+)\]/)){ // 繰り返しできないなぁ...
				var w = RegExp.$1;
				var ew = escape(RegExp.$1);
				cat = cat.replace(/\[([^\:\[\]]+)\]/, '[<a class="sectioncategory" href="' + b + '?word=' + ew + '">' + w + '</a>]');
			}
		}*/
		var extra = '';
		var ret = this._formatname(name);
		var name = (ret[0] != undefined ? ret[0] : ""); extra = (ret[1] != undefined ? ret[1] : "");
		c.htmllines(t + '<h3><a href="' + p + '#' + name + '" name="' + name + '"><span class="sanchor">' + sa + '</span></a> ' + cat + title + '</h3>' + extra);
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
		if(name != ""){
			return [name];
		} else {
			this.self.context.incrementsection();
			name = 'p' + this.self.context.self.sectioncount;
			return [name];
		}
	}
})


// Hatena::H4Node
Hatena.H4Node = function(){};
Hatena.H4Node.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.self.pattern = /^\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.shiftline();
		if(l == null) return;
		if(!l.match(this.self.pattern)) return;
		var t = times("\t", this.self.ilevel);
		c.htmllines(t + "<h4>" + RegExp.$1 + "</h4>");
	}
})


// Hatena::H5Node
Hatena.H5Node = function(){};
Hatena.H5Node.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.self.pattern = /^\*\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.shiftline();
		if(l == null) return;
		if(!l.match(this.self.pattern)) return;
		var t = times("\t", this.self.ilevel);
		c.htmllines(t + "<h5>" + RegExp.$1 + "</h5>");
	}
})


// Hatena::ListNode
Hatena.ListNode = function(){};
Hatena.ListNode.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.self.pattern = /^([\-\+]+)([^>\-\+].*)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.nextline();
		if(!l.match(this.self.pattern)) return;
		this.self.llevel = RegExp.$1.length;
		var t = times("\t", this.self.ilevel + this.self.llevel - 1);
		this.self.type = RegExp.$1.substr(0, 1) == '-' ? 'ul' : 'ol';

		c.htmllines(t + "<" + this.self.type + ">");
		while (l = c.nextline()) {
			if(!l.match(this.self.pattern)) break;
			if (RegExp.$1.length > this.self.llevel) {
				//c.htmllines(t + "\t<li>"); bug??
				var node = new Hatena.ListNode();
				node._new({
					context : this.self.context,
					ilevel : this.self.ilevel
				});
				node.parse();
				//c.htmllines(t + "\t</li>"); bug??
			} else if(RegExp.$1.length < this.self.llevel) {
				break;
			} else {
				l = c.shiftline();
				c.htmllines(t + "\t<li>" + RegExp.$2 + "</li>");
			}
		}
		c.htmllines(t + "</" + this.self.type + ">");
	}
})


// Hatena::PNode
Hatena.PNode = function(){};
Hatena.PNode.prototype = extend(new Hatena.Node(), {
	parse :function(){
		var c = this.self.context;
		var t = times("\t", this.self.ilevel);
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
		this.self.pattern = /^>\|$/;
		this.self.endpattern = /(.*)\|<$/;
		this.self.startstring = "<pre>";
		this.self.endstring = "</pre>";
	},

	parse : function(){
		c = this.self.context;
		if(!c.nextline().match(this.self.pattern)) return;
		c.shiftline();
		var t = times("\t", this.self.ilevel);
		c.htmllines(t + this.self.startstring);
		var x = '';
		while (c.hasnext()) {
			var l = c.nextline();
			if (l.match(this.self.endpattern)) {
				var x = RegExp.$1;
				c.shiftline();
				break;
			}
			c.htmllines(this.escape_pre(c.shiftline()));
		}
		c.htmllines(x + this.self.endstring);
	},

	escape_pre : function(text){ return text; }
})


// Hatena::SuperpreNode
Hatena.SuperpreNode = function(){};
Hatena.SuperpreNode.prototype = extend(new Hatena.PreNode(), {
	init : function(){
		this.self.pattern = /^>\|\|$/;
		this.self.endpattern = /^\|\|<$/;
		this.self.startstring = "<pre>";
		this.self.endstring = "</pre>";
	},

	escape_pre : function(s){
		return escapeHTML(s);
	}
})


// Hatena::TableNode
Hatena.TableNode = function(){};
Hatena.TableNode.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.self.pattern = /^\|([^\|]*\|(?:[^\|]*\|)+)$/;
	},

	parse : function(s){
		var c = this.self.context;
		var l = c.nextline();
		if(!l.match(this.self.pattern)) return;
		var t = times("\t", this.self.ilevel);

		c.htmllines(t + "<table>");
		while (l = c.nextline()) {
			if(!l.match(this.self.pattern)) break;
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
})


// Hatena::Section
Hatena.SectionNode = function(){};
Hatena.SectionNode.prototype = extend(new Hatena.Node(), {
	init : function(){
		this.self.childnode = ["h5", "h4", "h3", "blockquote", "dl", "list", "pre", "superpre", "table", "tagline", "tag"];
		this.self.startstring = '<div class="section">';
		this.self.endstring = '</div>';
		this.self.child_node_refs = Array();
	},

	parse : function(){
		var c = this.self.context;
		var t = times("\t", this.self.ilevel);
		this._set_child_node_refs();
		c.htmllines(t + this.self.startstring);
		while (c.hasnext()) {
			var l = c.nextline();
			var node = this._findnode(l);
			if(node == null) return;
			// TODO: ref == instanceof ???
			//if (ref(node) eq 'Hatena.H3Node') {
			//	if(this.self.started++) break;
			//}
			node.parse();
		}
		c.htmllines(t + this.self.endstring);
	},

	_set_child_node_refs : function(){
		var c = this.self.context;
		var nodeoption = {
			context : c,
			ilevel : this.self.ilevel + 1
		};
		var invalid = Array();
		if(c.self.invalidnode) invalid[c.self.invalidnode] = Array();
		for(var i = 0; i <  this.self.childnode.length; i++) {
			var node = this.self.childnode[i];
			if(invalid[node]) continue;
			var mod = 'Hatena.' + node.charAt(0).toUpperCase() + node.substr(1).toLowerCase() + 'Node';
			var n = eval("new "+ mod +"()");
			n._new(nodeoption);
			this.self.child_node_refs.push(n);
		}
	},

	_findnode : function(l){
		for(var i = 0; i < this.self.child_node_refs.length; i++) {
			var node = this.self.child_node_refs[i];
			var pat = node.self.pattern;
			if(pat == null) continue;
			if (l.match(pat)) {
				return node;
			}
		}
		var nodeoption = {
			context : this.self.context,
			ilevel : this.self.ilevel + 1
		};
		if (l.length == 0) {
			var node = new Hatena.BrNode(nodeoption);
			node._new(nodeoption);
			return node;
		} else if (this.self.context.noparagraph()) {
			var node = new Hatena.CDataNode();
			node._new(nodeoption);
			return node;
		} else {
			var node = new Hatena.PNode;
			node._new(nodeoption);
			return node;
		}
	}
})


// Hatena::BrockquoteNode
Hatena.BlockquoteNode = function(){};
Hatena.BlockquoteNode.prototype = extend(new Hatena.SectionNode(), {
	init : function(){
		this.self.pattern = /^>>$/;
		this.self.endpattern = /^<<$/;
		this.self.childnode = ["h4", "h5", "blockquote", "dl", "list", "pre", "superpre", "table"];//, "tagline", "tag"];
		this.self.startstring = "<blockquote>";
		this.self.endstring = "</blockquote>";
	},

	parse : function(){
		var c = this.self.context;
		if(!c.nextline().match(this.self.pattern)) return;
		c.shiftline();
		var t = times("\t", this.self.ilevel);
		this._set_child_node_refs();
		c.htmllines(t + this.self.startstring);
		while (c.hasnext()) {
			var l = c.nextline();
			if (l.match(this.self.endpattern)) {
				c.shiftline();
				break;
			}
			var node = this._findnode(l);
			if(node == null) break;
			node.parse();
		}
		c.htmllines(t + this.self.endstring);
	}
})


// Hatena::TagNode
Hatena.TagNode = function(){};
Hatena.TagNode.prototype = extend(new Hatena.SectionNode(), {
	init : function(){
		this.self.pattern = /^>(<.*)$/;
		this.self.endpattern = /^(.*>)<$/;
		this.self.childnode = ["h4", "h5", "blockquote", "dl", "list", "pre", "superpre", "table"];
		this.self.child_node_refs = Array();
	},

	parse : function(){
		var c = this.self.context;
		var t = times("\t", this.self.ilevel);
		if(!c.nextline().match(this.self.pattern)) return;
		c.shiftline();
		c.noparagraph(1);
		this._set_child_node_refs();
		var x =this._parse_text(RegExp.$1);
		c.htmllines(t + x);
		while (c.hasnext()) {
			var l = c.nextline();
			if (l.match(this.self.endpattern)) {
				c.shiftline();
				x = this._parse_text(RegExp.$1);
				c.htmllines(t + x);
				break;
			}
			var node = this._findnode(l);
			if(node == null) break;
			node.parse();
		}
		c.noparagraph(0);
	},

	_parse_text : function(l){
		var text = new Hatena.Text();
		text._new({context : this.self.context});
		text.parse(l);
		return text.html();
	}
})


// Hatena::TaglineNode
Hatena.TaglineNode = function(){};
Hatena.TaglineNode.prototype = extend(new Hatena.SectionNode(), {
	init : function(){
		this.self.pattern = /^>(<.*>)<$/;
		this.self.child_node_refs = Array();
	},

	parse : function(){
		var c = this.self.context;
		var t = times("\t", this.self.ilevel);
		if(!c.nextline().match(this.self.pattern)) return;
		c.shiftline();
		c.htmllines(t + RegExp.$1);
	}
})


// Hatena::Text
Hatena.Text = function(){}
Hatena.Text.prototype = {
	_new : function(args){
		this.self = {
			context : args["context"],
			html : ''
		};
	},

	parse : function(text){
		this.self.html = '';
		if(text == null) return;
		this.self.html = text;
	},

	html : function(){return this.self.html;}
}


// Hatena クラスを TextHatena として公開
global.TextHatena = Hatena;

// 後方互換のために Hatena としても公開
// 将来的に削除する可能性があるので今後の利用は非推奨とする
if (typeof global.Hatena == "undefined") {
	global.Hatena = Hatena;
}

})(this);

