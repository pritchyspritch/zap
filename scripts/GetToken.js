var HttpRequestHeader = Java.type("org.parosproxy.paros.network.HttpRequestHeader");
var HtmlParameter = Java.type("org.parosproxy.paros.network.HtmlParameter");
var HtmlParameterType = Java.type("org.parosproxy.paros.network.HtmlParameter.Type");
var HttpMessage = Java.type("org.parosproxy.paros.network.HttpMessage");
var HttpHeader = Java.type("org.parosproxy.paros.network.HttpHeader");
var URI = Java.type("org.apache.commons.httpclient.URI");

function sendingRequest(msg, initiator, helper) {
  print('requestReceived called for url=' + url);
  var url = msg.getRequestHeader().getURI().toString();
    if (url.contains('#{apiUrl}#')) {
      // Adding token to requests containing following url
      msg2 = msg.cloneAll()
      //************ Add Code to update msg2 with URL,Headers for authentication. *******************

      helper.getHttpSender().sendAndReceive(msg2, true); //Generating token
    

      //Adding Bearer token generated to the API calls made by ZAP (msg)
      var header = msg.getRequestHeader();
      header.setHeader("Authorization", "Bearer " + JSON.parse(msg2.getResponseBody()).access_token);
      msg.setRequestHeader(header);
    }
}
function responseReceived(msg, initiator, helper) {
    var url = msg.getRequestHeader().getURI().toString();
    if (url.contains('#{apiUrl}#')) { // Adding token to requests containing following url
        print('responseReceived called for url=' + msg.getRequestHeader().getURI().toString())
        print('responseReceived called response status = ' + msg.getResponseHeader().getStatusCode())
    }
}