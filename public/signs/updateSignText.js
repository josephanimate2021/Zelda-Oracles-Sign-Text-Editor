// Code for updating sign text in the oracle games
jQuery.blockUI();
// inputs a starting path for OS users
if (navigator.userAgent.includes("Windows")) $("#folderPath").html('<span class="input-group-text">C:\\</span>')
else $("#folderPath").html('<span class="input-group-text">/</span>');
$("#folderPath").append(`<input type="text" class="form-control" id="disasmFolderPath" name="disasmFolderPath" required="" value="${
    JSON.parse(localStorage.getItem("oracles_appSettings")).oraclesDisasmFolderPath.substr(
        navigator.userAgent.includes("Windows") ? 3 : 1
    ) || ''
}">
<div class="invalid-feedback">
    Please type in the path 
</div>`).show();
function sendRequestMessage(msg, color) {
    $("#requestMessageBlock").css("color", color).html(msg);
}
const json = Object.fromEntries(new URLSearchParams(window.location.search));
let oldJson;
console.log(json);
jQuery.post("/oracles/api/signText/get" + window.location.search, d => { // gets metadata from a sign
    if (d.msg) sendRequestMessage(d.msg, d.color);
    else {
        oldJson = d;
        $("#game").val(json.game);
        $("#signPosition").val(d.signPosition);
        $("#roomIndex").val(d.roomIndex.toUpperCase());
        $("#signText").val(d.text);
        $("#disasmFolderPath").val(json.disasmFolderPath);
        jQuery.unblockUI();
    }
});
function signInfoEntered(obj) { // updates sign info from user input
    jQuery.blockUI();
    jQuery.post(`/oracles/api/signText/update/${oldJson.signPosition}/${oldJson.roomIndex}/${oldJson.name}?${$(obj).serialize()}`, d => {
        sendRequestMessage(d.msg, d.color);
        jQuery.unblockUI();
    })
}