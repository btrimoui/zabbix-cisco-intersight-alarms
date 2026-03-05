/* ============================
 * Cisco Intersight – Active Alarms
 * Zabbix 7.x
 * OAuth2 Client Credentials
 * Optional Proxy
 * Pagination support
 * ============================ */

function base64Encode(input) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    var i = 0;

    while (i < input.length) {
        var c1 = input.charCodeAt(i++);
        var c2 = input.charCodeAt(i++);
        var c3 = input.charCodeAt(i++);

        var e1 = c1 >> 2;
        var e2 = ((c1 & 3) << 4) | (c2 >> 4);
        var e3 = ((c2 & 15) << 2) | (c3 >> 6);
        var e4 = c3 & 63;

        if (isNaN(c2)) e3 = e4 = 64;
        else if (isNaN(c3)) e4 = 64;

        output += chars.charAt(e1) +
                  chars.charAt(e2) +
                  chars.charAt(e3) +
                  chars.charAt(e4);
    }
    return output;
}

/* ---- Optional proxy handling ---- */
var proxy = '{$INTERSIGHT.PROXY}';

/* ---- HTTP client for API requests ---- */
var req = new HttpRequest();
if (proxy !== '') {
    req.setProxy(proxy);
}

/* ---- HTTP client for OAuth token ---- */
var tokenReq = new HttpRequest();
if (proxy !== '') {
    tokenReq.setProxy(proxy);
}

/* ---- Step 1: OAuth2 token request ---- */
tokenReq.addHeader('Content-Type: application/x-www-form-urlencoded');

var basicAuth = 'Basic ' + base64Encode(
    '{$INTERSIGHT.OAUTH.CLIENT_ID}' + ':' +
    '{$INTERSIGHT.OAUTH.CLIENT_SECRET}'
);

tokenReq.addHeader('Authorization: ' + basicAuth);

var tokenResp = tokenReq.post(
    '{$INTERSIGHT.OAUTH.TOKEN_URL}',
    'grant_type=client_credentials'
);

var tokenData = JSON.parse(tokenResp);

if (!tokenData.access_token) {
    throw 'OAuth token error: ' + tokenResp;
}

/* ---- Step 2: Call Intersight cond/Alarms API with pagination ---- */
req.addHeader('Authorization: Bearer ' + tokenData.access_token);

var baseUrl = '{$INTERSIGHT.API.BASE_URL}' +
              '/api/v1/cond/Alarms?' +
              '$inlinecount=allpages&' +
              '$top=500&' +
              '$filter=' +
              'Acknowledge%20eq%20\'None\'%20and%20' +
              'Suppressed%20eq%20false%20and%20' +
              'Severity%20ne%20\'Cleared\'';

var allResults = [];
var skip = 0;
var totalCount = null;

while (true) {
    var resp = JSON.parse(req.get(baseUrl + '&$skip=' + skip));

    if (totalCount === null && resp.Count !== undefined) {
        totalCount = resp.Count;
    }

    if (!resp.Results || resp.Results.length === 0) {
        break;
    }

    allResults = allResults.concat(resp.Results);

    if (resp.Results.length < 500) {
        break;
    }

    skip += 500;
}

/* ---- Debug logging (safe to keep) ---- */
Zabbix.log(4,
    'Intersight cond/Alarms: fetched=' + allResults.length +
    (totalCount !== null ? ' total=' + totalCount : '')
);

/* ---- Return merged payload ---- */
return JSON.stringify({
    Count: totalCount,
    Results: allResults
});
