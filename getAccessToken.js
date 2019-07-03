var gOAuthClient = new sn_auth.GlideOAuthClient();
var params = {grant_type:"password", username:'username', password:'password'};
var json = new global.JSON();
var body = json.encode(params);
var response = gOAuthClient.requestToken('application', body);
var token = response.getToken();
gs.log("Token:" + token.getAccessToken());
gs.log("Expires:" + token.getExpiresIn());
gs.log("New Token:" + token.getRefreshToken()); //Not working
