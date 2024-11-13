// Code for updating sign text in the oracle games
jQuery.blockUI();
// inputs a starting path for OS users
if (navigator.userAgent.includes("Windows")) $("#folderPath").html('<span class="input-group-text">C:\\</span>')
else $("#folderPath").html('<span class="input-group-text">/</span>');
$("#folderPath").append(`<input type="text" class="form-control" id="disasmFolderPath" name="disasmFolderPath" required="">
<div class="invalid-feedback">
    Please type in the path 
</div>`).show();
function sendRequestMessage(msg, color) {
    $("#requestMessageBlock").css("color", color).html(msg);
}
const json = Object.fromEntries(new URLSearchParams(window.location.search))
console.log(json);
jQuery.post("/oracles/api/signText/get" + window.location.search, d => { // gets metadata from a sign
    if (d.msg) sendRequestMessage(d.msg, d.color);
    else {
        $("#game").val(json.game);
        $("#signPosition").val(d.signPosition);
        $("#roomIndex").val(d.roomIndex.toUpperCase());
        $("#signText").val(d.text);
        $("#disasmFolderPath").val(json.disasmFolderPath);
        jQuery.unblockUI();
    }
})