// loads in a form for simplified game generation with Archipelago. 
// their web version also works as well. downside is, you have to upload a yaml file from a certain game in the Templates Folder within the 
// Archipelago folder in order to generate your own.
function loadGameGenerationForm(form, clearHTML = true) {
    jQuery.blockUI();
    jQuery(".genHameBtn").hide();
    if (clearHTML) {
        jQuery("#gameGenForm").html('')
        jQuery("#gameGenForm").prop("data-formsCounter", 0);
    } else jQuery("#gameGenForm").prop("data-formsCounter", (Number(jQuery("#gameGenForm").data("formsCounter"))++));
    jQuery.post("/archipelago/api/loadGameGenerationForm?" + form, d => {
        jQuery.unblockUI();
        jQuery("#gameGenForm")[clearHTML ? 'html' : 'append'](d);
    })
}
loadGameGenerationForm();
function genArchipelagoGame(obj) {
    jQuery.blockUI();
    jQuery.post(`/archipelago/api/gameGeneration?${$(obj).serialize()}`, Messages.feedbackBlock)
}