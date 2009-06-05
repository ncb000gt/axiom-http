importPackage(Packages.java.net);
importPackage(Packages.java.io);
importClass(Packages.java.lang.Runnable,Packages.java.lang.Thread);


if (!global.axiom) {
    global.axiom = {};
}

axiom.HTTP = {
    encode_params: function(params) {
	var data = '';
	var count = 0;
	for (var p in params) {
	    data += ((count != 0)?'&':'')+URLEncoder.encode(p, "UTF-8") + "=" + URLEncoder.encode(params[p], "UTF-8");
	    count++;
	}
	return data;
    },
    get_common_type: function(str, type) {
	var ret = str;

	if (['text/json','application/json'].contains(type.substring(0,(type.indexOf(';')||type.length)))) {
	    try {
		var json = null;
		eval('json = ' + str);
		return json;
	    } catch (e) {
		app.log('Error: Could not convert type to JSON, returning as byte array. ' + e);
	    }
	} else if(['text/html','text/xml','application/html','application/xml'].contains(type.substring(0,(type.indexOf(';')||type.length)))) {
	    try {
		str = str.replace(/\<(!DOCTYPE|\?xml)[^\>]*>/g, '');
		return new XHTML(str);
	    } catch (e) {
		app.log('Error: Could not convert type to XHTML, returning as byte array. ' + e);
	    }
	} else if (type.indexOf("text/") >= 0) {
	    return str;
	}

	return (new Packages.java.lang.String(ret)).getBytes();
    },
    get: function(url, params) {
	var data = axiom.HTTP.encode_params(params);
	var prefix = '?';
	if (params) {
	    if (url.indexOf('?') >= 0) {
		prefix = '&';
	    } else {
		prefix = '?';
	    }

	    url += prefix + data ;
	}
	
	url = new URL(url);
	var conn = url.openConnection();

	var str = '';
	var reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        var line;
        while ((line = reader.readLine()) != null) {
            str += line + '\n';
        }

        reader.close();

	return axiom.HTTP.get_common_type(str, conn.getContentType());
    },
    post: function(url, params) {
	var data = axiom.HTTP.encode_params(params);
	url = new URL(url);
	var conn = url.openConnection();
	conn.setDoOutput(true);
        var writer = new OutputStreamWriter(conn.getOutputStream());
        writer.write(data);
        writer.flush();


	var str = '';
	var reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        var line;
        while ((line = reader.readLine()) != null) {
            str += line + '\n';
        }

	writer.close();
        reader.close();

	return axiom.HTTP.get_common_type(str, conn.getContentType());
    },
    ajax: function(url, data, callback, type) {
	var r = new Runnable() {
	    run: function() {
		type = type || 'get';
		callback(axiom.HTTP[type](url, data));
	    }
	};

	new Thread(r).start();
    }
};