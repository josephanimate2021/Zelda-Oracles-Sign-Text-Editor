/* 
This script handles user preferences by storing and retrieving user data from a user's browser cookie to save space on the user's computer. 
*/
function showModalDropdownOptions(obj) { // moved dropdown options to a modal to prevent the options from overlapping the page
  const modal = $("#dropdownOptions");
  modal.find("h1").text($(obj).find("span").text())
  modal.find("ul").html($(obj).find("ul").html())
  modal.modal('show');
}
const callableFunctionsFromJqueryData = {};
function loadSettings() {
  settingsSwitch('basicFeatures');
  const settings = JSON.parse(localStorage.getItem("oracles_appSettings"));
  Object.keys(settings).forEach(key => {
    $(`#${key}`).val(settings[key]);
  })
}
function settingsSwitch(setting) {
  $("#settingsOptions").each((index, elem) => {
    $(elem).find("a").removeClass("active")
  });
  if (!$(`#${setting}`).hasClass("active")) $(`#${setting}`).addClass("active");
  $("#settingsBlock").find(".setting").each((index, elem) => {
    if ($(elem).data("setting") == setting) $(elem).show();
    else $(elem).hide();
    if ($(elem).data("setting-call-function")) callableFunctionsFromJqueryData[$(elem).data("setting-call-function")]();
  });
}
function changeSettings() {
  localStorage.setItem("oracles_appSettings", JSON.stringify(Object.fromEntries(new URLSearchParams($("#settingsBlock").serialize()))));
  Messages.feedbackBlock({
    messageType: "info",
    text: "Your settings were updated successfully."
  });
}