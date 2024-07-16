/*
This is part of a set of scripts which allow you to authenticate to Juice Shop using Selenium.

These scripts will currently only run in Oracle Nashorn and not Graal.js 
which means you need to run ZAP using Java 11.

---

This script injects the authentication token into the verification request.
Without this token the verification request would always fail.

It also records stats which allow us to test that the authentication is working
in all cases.

*/

function logger() {
    print("[" + this["zap.script.name"] + "] " + arguments[0]);
  }
  
  function isStaticUrl(url) {
    if (url.indexOf(".xml") !== -1) {
      return true;
    }
  
    if (url.indexOf(".css") !== -1) {
      return true;
    }
  
    if (url.indexOf(".gif") !== -1) {
      return true;
    }
  
    if (url.indexOf(".js") !== -1) {
      return true;
    }
  
    if (url.indexOf(".txt") !== -1) {
      return true;
    }
  
    if (url.indexOf(".htm") !== -1) {
      return true;
    }
    return false;
  }
  
  var HttpSender = Java.type("org.parosproxy.paros.network.HttpSender");
  var ScriptVars = Java.type("org.zaproxy.zap.extension.script.ScriptVars");
  var Stats = Java.type("org.zaproxy.zap.utils.Stats");
  
  var siteAddr = "https://pp-services.signin.education.gov.uk/";
  
  function sendingRequest(msg, initiator, _helper) {
    var headers = msg.getRequestHeader();
    var url = headers.getURI().toString();
  
    if (!url.startsWith(siteAddr)) {
      return true;
    }
    if (isStaticUrl(url)) {
      return true;
    }
  
    var cookie = ScriptVars.getGlobalVar("site.cookie");
  
    if (cookie) {
      Stats.incCounter("stats.site.globaltoken.present");
    } else {
      Stats.incCounter("stats.site.globaltoken.absent");
    }
  
    if (initiator === HttpSender.AUTHENTICATION_INITIATOR) {
      if (url.startsWith(siteAddr)) {
        // Need to add these for the verification request
        logger(url + " adding token to authentication request");
        // msg.getRequestHeader().setHeader("Authorization", "Bearer " + token);
        msg.getRequestHeader().setHeader("Cookie", cookie);
      }
    } else if (initiator === HttpSender.AJAX_SPIDER_INITIATOR) {
      var header = msg.getRequestHeader();
    //   var auth = header.getHeader("Authorization");
      var cookie = header.getHeader("Cookie");
      // Record stats to give us some confidence that the AJAX spider is authenticated
    //   if (auth) {
    //     Stats.incCounter("stats.site.authtoken.present");
    //   } else {
    //     Stats.incCounter("stats.site.authtoken.absent");
    //   }
      if (cookie && cookie.indexOf("session=") > -1) {
        Stats.incCounter("stats.site.cookie.present");
      } else {
        Stats.incCounter("stats.site.cookie.absent");
      }
    }
  
    return true;
  }
  
  function responseReceived(_msg, _initiator, _helper) {
    return true;
  }