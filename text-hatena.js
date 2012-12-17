// from prototype.js
Object.extend = function(destination, source) {
  for (property in source) {
	destination[property] = source[property];
  }
  return destination;
}

String.times = function(str, time){
	var s = "";
	for(var i = 0; i < time; i++)s += "\t";
	return s;
}

String._escapeHTML = function(s){
	s = s.replace(/\&/g, "&amp;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;");
	s = s.replace(/\'/g, "&#39");
	s = s.replace(/\\/g, "&#92");
	return s;
}

String._unescapeHTML = function(s){
	s = s.replace(/&amp;/g, "&");
	s = s.replace(/&lt;/g, "<");
	s = s.replace(/&gt;/g, ">");
	s = s.replace(/&quot;/g, "\"");
	return s;
}


// Hatena
Hatena = function(args){
	if(args == null) args = {};
	this.self = {
		baseuri : args["baseuri"],
		permalink : args["permalink"] || "",
		ilevel : args["ilevel"] || 0,
		invalidnode : args["invalidnode"] || [],
		sectionanchor : args["sectionanchor"] || 'o-'
	};
}
Hatena.prototype = {
	parse : function(text){
		this.self.context = new Hatena_Context({
			text : text || "",
			baseuri : this.self.baseuri,
			permalink : this.self.permalink,
			invalidnode : this.self.invalidnode,
			sectionanchor : this.self.sectionanchor
		});
		var node = new Hatena_BodyNode();
		node._new({
			context : this.self.context,
			ilevel : this.self.ilevel
		});
		node.parse();
	}, 

	html : function(){
		return this.self.context.html();
	}
}


// Hatena::Context
Hatena_Context = function(args){
	this.self = {
		text : args["text"],
		baseuri : args["baseuri"],
		permalink : args["permalink"],
		invalidnode : args["invalidnode"],
		sectionanchor : args["sectionanchor"],
		_htmllines : [],
		footnotes : Array(),
		sectioncount : 0,
		syntaxrefs : [],
		nopragraph : 0
	};
	this.init();
}
Hatena_Context.prototype = {
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
Hatena_Node = function(){}
Hatena_Node.prototype = {
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
Hatena_BodyNode = function(){};
Hatena_BodyNode.prototype = Object.extend(new Hatena_Node(), {
	parse : function(){
		while (this.self.context.hasnext()) {
			var node = new Hatena_SectionNode();
			node._new({
				context : this.self.context,
				ilevel : this.self.ilevel
			});
			node.parse();
		}
		if (this.self.context.footnotes()) {
			var node = new Hatena_FootnoteNode();
			node._new({
				context : this.self.context,
				ilevel : this.self.ilevel
			});
			node.parse();
		}
	}
})


// Hatena::BrNode
Hatena_BrNode = function(){};
Hatena_BrNode.prototype = Object.extend(new Hatena_Node(), {
	parse : function(){
		var c = this.self.context;
		var l = c.shiftline();
		if(l.length != 0) return;
		var t = String.times("\t", this.self.ilevel);
		if (c.lasthtmlline() == t + "<br>" || c.lasthtmlline() == t) {
			c.htmllines(t + "<br>");
		} else {
			c.htmllines(t);
		}
	}
})


// Hatena::CDataNode
Hatena_CDataNode = function(){};
Hatena_CDataNode.prototype = Object.extend(new Hatena_Node(), {
	parse : function(){
		var c = this.self.context;
		var t = String.times("\t", this.self.ilevel);
		var l = c.shiftline();
		var text = new Hatena_Text();
		text._new({context : c});
		text.parse(l);
		l = text.html();
		c.htmllines(t + l);
	}
})


// Hatena::DlNode
Hatena_DlNode = function(){};
Hatena_DlNode.prototype = Object.extend(new Hatena_Node(), {
	init : function(){
		this.self.pattern = /^\:((?:<[^>]+>|\[\].+?\[\]|\[[^\]]+\]|\[\]|[^\:<\[]+)+)\:(.+)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.nextline();
		if(!l.match(this.self.pattern)) return;
		this.self.llevel = RegExp.$1.length;
		var t = String.times("\t", this.self.ilevel);

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
Hatena_FootnoteNode = function(){};
Hatena_FootnoteNode.prototype = Object.extend(new Hatena_Node(), {
	parse : function(){
		var c = this.self["context"];
		if(c.self.footnotes == null || c.self.footnotes.length == 0) return;
		var t = String.times("\t", this.self["ilevel"]);
		var p = c.self.permalink;

		c.htmllines(t + '<div class="footnote">');
		var num = 0;
		var text = new Hatena_Text();
		text._new({context : c});
		for(var i = 0; i < c.self.footnotes.length; i++) {
			var note = c.self.footnotes[i];
			num++;
			text.parse(note);
			var l = t + '\t<p class="footnote"><a href="' + p + '#fn' + num + '" name="f' + num + '">*' + num + '</a>: '
				+ text.html() + '</p>';
			c.htmllines(l);
		}
		c.htmllines(t + '</div>');
	}
})


// Hatena::H3Node
Hatena_H3Node = function(){};
Hatena_H3Node.prototype = Object.extend(new Hatena_Node(), {
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
		var t = String.times("\t", this.self.ilevel);
		var sa = c.self.sectionanchor;

		/* TODO: ���ƥ����̤�б�
		if (cat) {
			if(cat.match(/\[([^\:\[\]]+)\]/)){ // �����֤��Ǥ��ʤ��ʤ�...
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
		/* TODO: ���֤�̤�б���ɽ�����λ��֤�ɽ������Ƥ��ޤ�...
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
Hatena_H4Node = function(){};
Hatena_H4Node.prototype = Object.extend(new Hatena_Node(), {
	init : function(){
		this.self.pattern = /^\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.shiftline();
		if(l == null) return;
		if(!l.match(this.self.pattern)) return;
		var t = String.times("\t", this.self.ilevel);
		c.htmllines(t + "<h4>" + RegExp.$1 + "</h4>");
	}
})


// Hatena::H5Node
Hatena_H5Node = function(){};
Hatena_H5Node.prototype = Object.extend(new Hatena_Node(), {
	init : function(){
		this.self.pattern = /^\*\*\*((?:[^\*]).*)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.shiftline();
		if(l == null) return;
		if(!l.match(this.self.pattern)) return;
		var t = String.times("\t", this.self.ilevel);
		c.htmllines(t + "<h5>" + RegExp.$1 + "</h5>");
	}
})


// Hatena::ListNode
Hatena_ListNode = function(){};
Hatena_ListNode.prototype = Object.extend(new Hatena_Node(), {
	init : function(){
		this.self.pattern = /^([\-\+]+)([^>\-\+].*)$/;
	},

	parse : function(){
		var c = this.self.context;
		var l = c.nextline();
		if(!l.match(this.self.pattern)) return;
		this.self.llevel = RegExp.$1.length;
		var t = String.times("\t", this.self.ilevel + this.self.llevel - 1);
		this.self.type = RegExp.$1.substr(0, 1) == '-' ? 'ul' : 'ol';

		c.htmllines(t + "<" + this.self.type + ">");
		while (l = c.nextline()) {
			if(!l.match(this.self.pattern)) break;
			if (RegExp.$1.length > this.self.llevel) {
				//c.htmllines(t + "\t<li>"); bug??
				var node = new Hatena_ListNode();
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
Hatena_PNode = function(){};
Hatena_PNode.prototype = Object.extend(new Hatena_Node(), {
	parse :function(){
		var c = this.self.context;
		var t = String.times("\t", this.self.ilevel);
		var l = c.shiftline();
		var text = new Hatena_Text();
		text._new({context : c});
		text.parse(l);
		l = text.html();
		c.htmllines(t + "<p>" + l + "</p>");
	}
});


// Hatena::PreNode
Hatena_PreNode = function(){};
Hatena_PreNode.prototype = Object.extend(new Hatena_Node(), {
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
		var t = String.times("\t", this.self.ilevel);
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
Hatena_SuperpreNode = function(){};
Hatena_SuperpreNode.prototype = Object.extend(new Hatena_PreNode(), {
	init : function(){
		this.self.pattern = /^>\|\|$/;
		this.self.endpattern = /^\|\|<$/;
		this.self.startstring = "<pre>";
		this.self.endstring = "</pre>";
	},

	escape_pre : function(s){
		return String._escapeHTML(s);
	}
})


// Hatena::SuperpreNode
Hatena_TableNode = function(){};
Hatena_TableNode.prototype = Object.extend(new Hatena_Node(), {
	init : function(){
		this.self.pattern = /^\|([^\|]*\|(?:[^\|]*\|)+)$/;
	},

	parse : function(s){
		var c = this.self.context;
		var l = c.nextline();
		if(!l.match(this.self.pattern)) return;
		var t = String.times("\t", this.self.ilevel);

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

// Hatena::Text
Hatena_Text = function(){}
Hatena_Text.prototype = {
	_new : function(args){
		this.self = {
			context : args["context"],
			html : ''
		};
	},

	parse : function(text){
		this.self.html = '';
		if(text == null) return;

		// footnote
		var c = this.self.context; 
		var p = c.self.permalink;
		var html = "";
		var foot = text.split("((");
		for(var i = 0; i < foot.length; i++){
			if(i == 0){
				html += foot[i];
				continue;
			}

			if(!foot[i].match(/(.+?)\)\)(.*)/)){
				html += "((" + foot[i];
				continue;
			}
			var pre = foot[i - i];
			var note = RegExp.$1;
			var post = RegExp.$2;
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

		this.self.html = html;
	},

	html : function(){return this.self.html;}
}


// Hatena::Section
Hatena_SectionNode = function(){};
Hatena_SectionNode.prototype = Object.extend(new Hatena_Node(), {
	init : function(){
		this.self.childnode = ["h5", "h4", "h3", "blockquote", "dl", "list", "pre", "superpre", "table"];//{"h5", "h4", "h3", "blockquote", "dl", "list", "pre", "superpre", "table", "tagline", "tag"};
		this.self.startstring = '<div class="section">';
		this.self.endstring = '</div>';
		this.self.child_node_refs = Array();
	},

	parse : function(){
		var c = this.self.context;
		var t = String.times("\t", this.self.ilevel);
		this._set_child_node_refs();
		c.htmllines(t + this.self.startstring);
		while (c.hasnext()) {
			var l = c.nextline();
			var node = this._findnode(l);
			if(node == null) return;
			// TODO: ref == instanceof ???
			//if (ref(node) eq 'Hatena_H3Node') {
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
			var mod = 'Hatena_' + node.charAt(0).toUpperCase() + node.substr(1).toLowerCase() + 'Node';
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
			var node = new Hatena_BrNode(nodeoption);
			node._new(nodeoption);
			return node;
		} else if (this.self.context.noparagraph()) {
			var node = new Hatena_CDataNode();
			node._new(nodeoption);
			return node;
		} else {
			var node = new Hatena_PNode;
			node._new(nodeoption);
			return node;
		}
	}
})


// Hatena::BrockquoteNode
Hatena_BlockquoteNode = function(){};
Hatena_BlockquoteNode.prototype = Object.extend(new Hatena_SectionNode(), {
	init : function(){
		this.self.pattern = /^>>$/;
		this.self.endpattern = /^<<$/;
		this.self.childnode = ["h4", "h5", "blockquote", "dl", "list", "pre", "superpre", "table"];//, "tagline", "tag"];
		this.self.startstring = "<blockquote>";
		this.self.endstring = "</blockquote>";
		this.self.child_node_refs = Array();
	},

	parse : function(){
		var c = this.self.context;
		if(!c.nextline().match(this.self.pattern)) return;
		c.shiftline();
		var t = String.times("\t", this.self.ilevel);
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

