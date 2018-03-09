var fs=require('fs');
var http = require('http');

var MAX_RETURN_SET = 300;

// Load the dataset
if (process.argv[2] == null)
{
    console.error('Provide a data-set filename');
    return;
}

var fileBuf=JSON.parse(fs.readFileSync(process.argv[2]));
var indexHTML=fs.readFileSync('./index.html'); // Serve this for / requests 
console.log('items loaded:' + fileBuf.length);

http.createServer(onRequest).listen(process.env.PORT);

function onRequest(client_req, client_res) {
  console.log('serve: ' + client_req.url);

  // When the request is / serve index.html otherwise assume an API request

  // API is LAT=X (max lat); lat=x; LON=Y; lon=y
  // Anthing missing/not numeric just return the empty
  // array of items -- no error

  var result = {};

  var params = parseParams(client_req.url);

  if (params.good) {
    result = filter(fileBuf, params);
    client_res.writeHead(200,{'Content-Type':'application/json'});
    client_res.write(JSON.stringify(result));
    client_res.end();
  } else {
    if (client_req.url == "/") {
      client_res.writeHead(200,{'Content-Type':'text/html'});
      client_res.write(indexHTML);
      client_res.end();
    } else {
      result.params = params;
      client_res.writeHead(200,{'Content-Type':'application/json'});
      client_res.write(JSON.stringify(result));
      client_res.end();
    }
  }

}

var parseParams=function(url) {
  url=url.replace("/", "");
  var parts=url.split("&");
  var LAT=false;
  var lat=false;
  var LON=false;
  var lon=false;

  var result  = {};
  result.good = false;

  if (parts.length == 4) {
    for (p in parts) {
      if (parts[p].startsWith("LAT=")) { LAT=true;
                                         result.LAT=parseFloat(parts[p].replace("LAT=",""));
                                       }
      if (parts[p].startsWith("lat=")) { lat=true;
                                         result.lat=parseFloat(parts[p].replace("lat=",""));
                                       }
      if (parts[p].startsWith("LON=")) { LON=true;
                                         result.LON=parseFloat(parts[p].replace("LON=",""));
                                       }
      if (parts[p].startsWith("lon=")) { lon=true;
                                         result.lon=parseFloat(parts[p].replace("lon=",""));
                                       }
    }
    if (LAT && lat && LON && lon) {
      result.good = (!isNaN(result.lon) && !isNaN(result.LON) && !isNaN(result.LAT) && !isNaN(result.lat));
    }
  }
  return result;
}

var filter=function(set, filter){
  var results = {};
  var found   = [];
  var total   = 0;

  if (filter.good) {
    for (d in set) {
      try {
      if (set[d].position.lat <= filter.LAT && set[d].position.lat >= filter.lat &&
          set[d].position.lon <= filter.LON && set[d].position.lon >= filter.lon) {
        if (total < MAX_RETURN_SET) { found.push(set[d]); }
        total++;
      }
      } catch (e) {console.log('element failed' + d + ':' +  JSON.stringify(e));}
    }
  }

  results.params = filter;
  results.found = found;
  results.total = total;

  return results;
}
