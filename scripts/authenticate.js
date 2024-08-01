/*
This is part of a set of scripts which allow you to authenticate to Juice Shop using Selenium.

These scripts will currently only run in Oracle Nashorn and not Graal.js 
which means you need to run ZAP using Java 11.

---

This script handles authentication for requests that originate from ZAP,
e.g. from the traditional spider or the active scanner.

It launches a browser to authenticate to Juice Shop - this is not strictly 
necessary but this is a demonstration of what to do if you need authenticate
via a browser.

It also starts and uses a new proxy on a different port.
If this is not done then the script will hang as it will try to authenticate 
again using the script which is already running.

The proxy can be stopped via the JuiceShopReset script.
*/
var Files = Java.type("java.nio.file.Files");
var Paths = Java.type("java.nio.file.Paths");
var StandardOpenOption = Java.type("java.nio.file.StandardOpenOption");
var f = Paths.get("/zap/wrk/authenticatejs.txt");

var By = Java.type("org.openqa.selenium.By");
var Cookie = Java.type("org.openqa.selenium.Cookie");
var HttpRequestHeader = Java.type(
  "org.parosproxy.paros.network.HttpRequestHeader"
);
var HttpResponseHeader = Java.type(
  "org.parosproxy.paros.network.HttpResponseHeader"
);
var HttpHeader = Java.type("org.parosproxy.paros.network.HttpHeader");
var ScriptVars = Java.type("org.zaproxy.zap.extension.script.ScriptVars");
var System = Java.type("java.lang.System");
var Thread = Java.type("java.lang.Thread");
var URI = Java.type("org.apache.commons.httpclient.URI");

var extensionNetwork = control
  .getExtensionLoader()
  .getExtension("ExtensionNetwork");

var siteAddr = "https://pp-services.signin.education.gov.uk/";
var defaultDomain = "pp-services.signin.education.gov.uk"
var proxyAddress = "127.0.0.1";
var proxyPort = 9092;

var count = 0;
var limit = 2;

function appendToFile(str) {
  Files.write(
    f,
    str.toString().getBytes(),
    StandardOpenOption.CREATE,
    StandardOpenOption.APPEND
  );
}

function logger() {
  print("[" + this["zap.script.name"] + "] " + arguments[0]);
  appendToFile("[" + this["zap.script.name"] + "] " + arguments[0]);
}

function messageHandler(ctx, msg) {
  if (ctx.isFromClient()) {
    return;
  }
  var url = msg.getRequestHeader().getURI().toString();
  logger("messageHandler " + url);
  if (
    url === siteAddr + "auth/cb" &&
    msg.getRequestHeader().getMethod() === "GET"
  ) {
    
    var cookies = msg.getResponseHeader().getHTTPCookies(defaultDomain);

	  for (let i = 0; i < cookies.length; i++) {
      cookieName = cookies[i].getName();
      if (cookieName == "session") {
        sessionCookieValue = cookies[i].getValue();
      } else if (cookieName == "_csrf") {
        csrfCookieValue = cookies[i].getValue();
      }
		
		  logger("Cookies: " + cookies[i]);
	  }

    logger("Saving cookie");
    // save the authentication token
	  cookieValue = "_csrf=" + csrfCookieValue + "; session=" + sessionCookieValue;
    
    ScriptVars.setGlobalVar("site.cookie", cookieValue);

    logger("CookieValue: " + cookieValue);
  }
}

function authenticate(helper, _paramsValues, _credentials) {
  // Remove an existing token (if present) - in theory it may now be invalid
  ScriptVars.setGlobalVar("site.cookie", null);
  var proxy = ScriptVars.getGlobalCustomVar("auth-proxy");
  if (!proxy) {
    // We need to start a new proxy so that the request doesn't trigger another login sequence
    logger("Starting proxy");
    var proxy = extensionNetwork.createHttpProxy(5, messageHandler);
    proxy.start(proxyAddress, proxyPort);
    // Store the proxy in a global script var
    ScriptVars.setGlobalCustomVar("auth-proxy", proxy);
  }

  logger("Launching browser to authenticate");
  var extSel = control
    .getExtensionLoader()
    .getExtension(org.zaproxy.zap.extension.selenium.ExtensionSelenium.class);

  // Change to "firefox" (or "chrome") to see the browsers being launched
  var wd = extSel.getWebDriver(5, "firefox-headless", proxyAddress, proxyPort);
  logger("Got webdriver");

  // Initial request 
  logger(siteAddr);
  wd.get(siteAddr);
  
  wd.findElement(By.class("govuk-button govuk-button--start")).click();

  // These are standard selenium methods for filling out fields
  // You will need to change them to support different apps
  wd.findElement(By.id("username")).sendKeys(System.getenv("USER"));
  wd.findElement(By.id("password")).sendKeys(System.getenv("PWD"));
  wd.findElement(By.class("govuk-button")).click();

  logger("Submitting form");

  Thread.sleep(500);
  wd.quit();

  Thread.sleep(500);
  logger("Checking verification URL");
  cookie = ScriptVars.getGlobalVar("site.cookie");

  logger(cookie);

  // This is the verification URL
  var requestUri = new URI(siteAddr + "my-services", false);
  var requestMethod = HttpRequestHeader.GET;
  var requestHeader = new HttpRequestHeader(
    requestMethod,
    requestUri,
    HttpHeader.HTTP11
  );
  // The auth token and cookie will be added by the httpsender script
  var msg = helper.prepareMessage();
  msg.setRequestHeader(requestHeader);
  helper.sendAndReceive(msg);
  logger(msg);
  return msg;
}

function getRequiredParamsNames() {
  return [];
}

function getOptionalParamsNames() {
  return [];
}

function getCredentialsParamsNames() {
  return [];
}