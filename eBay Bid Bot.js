// ==UserScript==
// @name         eBay Bid Bot
// @match        https://www.ebay.com/itm/*
// @match        https://www.ebay.com/*
// @match        http://bidbot.io/
// @match        http://leotakacs.com/bidfinder/demopage.html
// @match        http://leotakacs.com/bidfinder/demopage*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
ran = false;
noSaveData = true;
testMode = false;
freeShipping = false;
curPrice = 0;
bidBotConfigWindowHTML = `
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
<div id="mainBotContainer" onkeyup="saveInputStates()" style="margin-left:10px">
</br>
<center>
</center>
</br>
</br>
</br>
<div id="incMode" >
$<input id="maxtotal2" class="save" style="inline;width:50px;" type="text" max="99999" min="1" size="6"> Max total price
</br>
$<input id="incamount" class="save" style="inline;width:50px;" type="text" max="99999" min="1" size="6"> Increment amount
</br>
</br>
&nbsp;&nbsp;<input id="seclength" onkeyup="rlButton()" onkeydown="rlButton()" class="save" style="inline;width:50px;" type="text" maxlength="2" min="1" max="59" size="1"> Seconds left to automatically start bot
</br>
</br>
</br>
<center>
<button id="simExtOutBidp2" style="font-size:14px" class="btn btn-default" onclick='initButton()'>Start bot</button>
</center>
</br>
</br>
</br>
</br>
</div>
<div style="margin-left:12px">
---------------------------------------------------</br>
<p>Current item price: </p><b id="curItemPriceStat">N/A</b></br>
<p>Shipping: </p><b id="shipPriceStat">N/A</b></br>
<p>Increment: </p><b id="incStat">N/A</b></br>
<p>Total: </p><b style="color:black" id="totalStat"></b>
</br>---------------------------------------------------</br></br>

</br>
</br>
<textarea style="font-size:12px" rows="25" cols="37" id="log">
</textarea>
</br>
</br>
</div>
</div>
<style>
p { display: inline }
</style>
`;
window.onload = function() {
    if (window.location.href.includes("bidbot")) {
        window.stop();
        box = function() {
            if (document.getElementById("stop").checked) {
                document.getElementById("globalLogOut").scrollTop = document.getElementById("globalLogOut").scrollHeight;
            }
        }
        cur = 0;
        document.documentElement.innerHTML = `
<title>eBay Bid Bot</title>
</br>
&nbsp;&nbsp;<input type="checkbox" id="stop" onclick="box()"> Auto scroll
&nbsp;&nbsp;<textarea cols="200" rows="25" id="globalLogOut"></textarea>
`;
        setInterval(function() {
            if (GM_getValue("globalLogData") != cur) {
                document.getElementsByTagName("textarea")[0].value = GM_getValue("globalLogData");
                if (document.getElementById("stop").checked) {
                    document.getElementById("globalLogOut").scrollTop = document.getElementById("globalLogOut").scrollHeight;
                }
                cur = GM_getValue("globalLogData");
            }
        }, 1000);
    }
    if (window.location.href.includes("ebay")) {
        document.getElementById("gh-btn").style.display = "none";
        document.getElementById("gh-ac").placeholder = "Use dashes '-' to separate multiple items. Press Enter for normal search or CTRL+Enter for bid search.";
        document.getElementById("gh-ac").onkeydown = keydown2;
        document.getElementsByClassName("gh-td")[3].innerHTML += `

<div style="margin-left:10px">
<div class="btn-group-vertical" role="group" aria-label="Vertical button group">
<button id="hi" type="button" style="color:white;background-color: #0099ff;" class="btn">Search</button>
</br>
<button id="hi" type="button" style="color:white;background-color: #4CAF50;" class="btn">Bid Search</button>
  </div>
</div>`;
        $("#hi").click(function() {
            // Send user to this link
            extB();
        });
    }
    if (localStorage.getItem("r_" + getItemId()) && document.getElementById("msgPanel").innerHTML.includes("You won")) {
        if (!parseFloat(document.getElementById("fshippingCost").childNodes[0].nodeValue)) {
            shipping = 0;
        } else {
            shipping = parseFloat(document.getElementById("fshippingCost").childNodes[0].nodeValue);
        }
        total = shipping + parseFloat(document.getElementsByClassName("notranslate vi-VR-cvipPrice")[0].innerHTML.replace("US $", ""));
        addToGlobalLog("Item " + "\"" + getItemTitle() + "\" (" + getItemId() + ")" + " has been won for a total of $" + total + ".");
        clearItemData(getItemId());
    }
    if (currentItemIsBid()) {
        if (!localStorage.getItem("pri_" + getItemId())) {
            localStorage.setItem("pri_" + getItemId(), "0");
        }
        document.getElementsByClassName("si-cnt si-cnt-eu vi-grBr vi-padn0 c-std")[0].innerHTML = bidBotConfigWindowHTML;
        loadLog();
        if (testMode) {
            addToLog("TEST MODE");
        }
        loadInputStates();
        u = setInterval(updateInfo, 2);
        j = setInterval(function() {
            if (ran) {
                clearInterval(j);
                testIfBid();
            }
        }, 10);
    };
}
updateInfo = function() {
    if (document.getElementById("seclength").value.length < 1) {
        snipeMode = false;
    } else {
        snipeMode = true;
    }
    document.getElementById("curItemPriceStat").innerHTML = parsePrice(getItemPrice());
    document.getElementById("shipPriceStat").innerHTML = parsePrice(getItemShipping());
    if (localStorage.getItem("inc_" + getItemId()) == "min") {
        bv = getItemPrice() + parseFloat(minBidDifference());
    } else {
        bv = getItemPrice() + parseFloat(parseFloat(document.getElementById("incamount").value));
    }
    if (bv) {
        e = parsePrice(currentBidDifference());
        cpr = bv + getItemShipping();
    } else {
        e = "N/A";
        cpr = getItemTotal();
    }
    document.getElementById("totalStat").innerHTML = parsePrice(cpr);
    document.getElementById("incStat").innerHTML = e;
    if (bv + getItemShipping() > parseFloat(document.getElementById("maxtotal2").value)) {
        document.getElementById("totalStat").style = "color:red";
    } else {
        document.getElementById("totalStat").style = "color:black";
    }
    ran = true;
};
testIfBid = function() {
    if (localStorage.getItem("r_" + getItemId()) == "1") {
        document.getElementById("simExtOutBidp2").innerHTML = "Stop Bot";
        document.getElementById("simExtOutBidp2").setAttribute("onclick", "stopBot()");
        if (document.getElementById("w1-5-_msg").innerHTML.includes("outbid") || !document.getElementById("w1-5-_msg").innerHTML.includes("highest bidder")) {
            initBid();
        } else {
            reload();
        }
        setTimeout(function() {
            reload();
        }, 2000);
    }
}
initBid = function() {
    gg = bv.toFixed(2);
    console.log("init bid1");
    y = setInterval(function() {
        if (document.getElementById("w1-5-_msg").innerHTML.includes("outbid") || !document.getElementById("w1-5-_msg").innerHTML.includes("highest bidder") || gg != parseFloat(localStorage.getItem("pri_" + getItemId()))) {
            clearInterval(y);
            bid(bv);
            console.log("init bid2 " + bv + "\n" + gg);
        }
    }, 12);
}
bid = function(dol) {
    dol = dol.toFixed(2);
    localStorage.setItem("pri_" + getItemId(), dol);
    if (!testMode) {
        console.log("bid3");
        if (dol + getItemShipping() <= parseFloat(localStorage.getItem("max_" + getItemId()))) {
            addToLog("Bidding $" + dol);
            document.getElementById("MaxBidId").value = dol;
            document.getElementById("bidBtn_btn").click();
            s = setInterval(function() {
                if (document.getElementById("statusmsg") && document.getElementById("confirm_button")) {
                    clearInterval(s);
                    document.getElementById("confirm_button").click();
                    document.getElementsByClassName("vilens-modal-close")[0].click();
                } else if (document.getElementById("statusmsg") && !document.getElementById("confirm_button")) {
                    clearInterval(s);
                    reload();
                }
            }, 30);
        } else {
            addToLog("Bot stopped, price exceeds maximum price limit.");
            clearItemData(getItemId());
            stopBot();
        }
        lastBid = dol;
    } else {
        alert(dol);
    }
};
rlButton = function() {
    if (document.getElementById("seclength").value.length < 1) {
        snipeMode = false;
        document.getElementById("simExtOutBidp2").innerHTML = "Start bot";
    } else {
        snipeMode = true;
        document.getElementById("simExtOutBidp2").innerHTML = "Start bot (when " + document.getElementById("seclength").value + "s remains)";
    }
}
reload = function() {
    window.location.href = window.location.href;
};
initButton = function() {
    if (document.getElementById("maxtotal2").value && document.getElementById("incamount").value) {
        localStorage.setItem("r_" + getItemId(), "1");
        if (document.getElementById("incamount").value == "min") {
            localStorage.setItem("inc_" + getItemId(), "min");
        } else {
            localStorage.setItem("inc_" + getItemId(), parseFloat(document.getElementById("incamount").value));
        }
        setTimeout(function() {
            if (snipeMode) {
                document.getElementById("simExtOutBidp2").innerHTML = "Waiting.... (click to cancel)";
                document.getElementById("simExtOutBidp2").setAttribute("onclick", "stopBot()");
                g = setInterval(function() {
                    if (document.getElementById("vi-cdown_timeLeft").innerHTML == document.getElementById("seclength").value + "s ") {
                        clearInterval(g);
                        initBid();
                    }
                }, 5);
            } else {
                initBid();
                document.getElementById("simExtOutBidp2").innerHTML = ".....";
                document.getElementById("simExtOutBidp2").disabled = true;
            }
        }, 500);
    }
};
stopBot = function() {
    document.getElementById("simExtOutBidp2").disabled = true;
    document.getElementById("simExtOutBidp2").innerHTML = ".....";
    clearItemData(getItemId());
    reload();
}
saveInputStates = function() {
    localStorage.setItem("max_" + getItemId(), document.getElementById("maxtotal2").value);
    localStorage.setItem("inc_" + getItemId(), document.getElementById("incamount").value);
}
loadInputStates = function() {
    document.getElementById("maxtotal2").value = localStorage.getItem("max_" + getItemId());
    document.getElementById("incamount").value = localStorage.getItem("inc_" + getItemId());
}
roundMon = function(aaa) {
    return parseFloat(aaa.toFixed(2));
}
parsePrice = function(ttlp) {
    ttl = "" + ttlp + "";
    if (ttl.includes(".")) {
        if (ttl.split(".")[1].length > 2) {
            ttl = ttl.slice(0, -(ttl.split(".")[1].length - 2));
        } else if (ttl.split(".")[1].length == 1) {
            ttl += "0";
        }
    } else {
        ttl += ".00";
    }
    ttl = "$" + ttl;
    return ttl;
}
currentItemIsBid = function() {
    if (document.getElementById("MaxBidId")) {
        return true;
    } else {
        return false;
    }
}
getItemPrice = function() {
    return parseFloat(document.getElementById("prcIsum_bidPrice").innerHTML.replace("US $", ""));
}
getItemShipping = function() {
    if (!document.getElementById("fshippingCost").innerHTML.includes("FREE")) {
        return parseFloat(document.getElementById("fshippingCost").innerHTML.replace(/[^\d.-]/g, ''));
    } else {
        return 0;
    }
}
getItemTotal = function() {
    if (getItemShipping() > 0) {
        return getItemPrice() + getItemShipping();
    } else {
        return getItemPrice();
    }
}
getItemId = function() {
    return document.getElementById("descItemNumber").innerHTML;
}
outbid = function() {
    if (document.getElementById("w1-5-_msg").innerHTML.includes("outbid") || !document.getElementById("w1-5-_msg").innerHTML.includes("highest bidder")) {
        return true;
    } else {
        return false;
    }
}
minBidValue = function() {
    note = document.getElementsByClassName("notranslate u-flL bid-note")[0].innerHTML.replace("Enter US $", "");
    note = note.replace(" or more ", "");
    note = note.replace(",", "");
    return parseFloat(note);
}
minBidDifference = function() {
    return minBidValue() - getItemPrice();
}

function keydown(evt) {
    if (!evt) evt = event;
    if (evt.altKey && evt.ctrlKey) {
        stopBot();
    }
}

function keydown2(evt) {
    if (!evt) evt = event;
    if (evt.ctrlKey && evt.keyCode === 13) {
        extB();
    }
}
clearItemData = function(a) {
    localStorage.removeItem("r_" + a);
    localStorage.removeItem("inc_" + a);
    localStorage.removeItem("max_" + a);
    localStorage.removeItem("sec_" + a);
    localStorage.removeItem("pri_" + a);
    localStorage.removeItem("log_" + a);
    console.log("Cleared data for item " + a);
}
currentBidDifference = function() {
    return bv - getItemPrice();
}
addToGlobalLog = function(text) {
    if (!localStorage.getItem("globalLog")) {
        localStorage.setItem("globalLog", "");
    }
    d = new Date();
    dateStamp = "[" + (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "]";
    tempGlobalLog = localStorage.getItem("globalLog");
    tempGlobalLog += dateStamp + " " + text + "\n";
    localStorage.setItem("globalLog", tempGlobalLog);
    GM_setValue("globalLogData", tempGlobalLog);
}
addToLog = function(text) {
    if (!localStorage.getItem("log_" + getItemId())) {
        localStorage.setItem("log_" + getItemId(), "");
    }
    d = new Date();
    dateStamp = "[" + (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "]";
    full = dateStamp + " " + text + "\n";
    tempLog = localStorage.getItem("log_" + getItemId());
    tempLog += full;
    addToGlobalLog(text + " (" + getItemId() + ")");
    localStorage.setItem("log_" + getItemId(), tempLog);
    document.getElementById("log").value = tempLog;
}
loadLog = function() {
    if (localStorage.getItem("log_" + getItemId())) {
        document.getElementById("log").value = localStorage.getItem("log_" + getItemId());
    }
}
viewGlobalLog = function() {
    console.log(localStorage.getItem("globalLog"));
}
viewLog = function(a) {
    console.log(localStorage.getItem("log_" + a, ));
}
getItemTitle = function() {
    return document.getElementById("itemTitle").childNodes[1].nodeValue;
}
extB = function() {
    abcd = document.getElementById("gh-ac").value;
    a = abcd.split("-");
    t = "(";
    for (i = 0; i < a.length; i++) {
        if (i == (a.length - 1)) {
            t += a[i];
        } else {
            t += a[i] + ",";
        }
    }
    t += ")";
    window.location.href = "https://www.ebay.com/sch/i.html?_from=R40&_nkw=" + t + "&_sacat=0&_sop=1&rt=nc&LH_Auction=1";
}