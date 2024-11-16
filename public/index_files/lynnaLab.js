// This script helps add some basic functionality that don't exist like LynnaLab; (Example: New Project)
function newLynnaLabProjectFromTemplate(isReallyUsingTemplate = true) { 
    // allows a user to create a new project using any oracles-disam templates he/she finds on github
    const modal = $("#modalNewProjectChoice");
    if (isReallyUsingTemplate && !modal.hasClass("isTemplateProject")) modal.addClass("isTemplateProject")
    else if (modal.hasClass("isTemplateProject")) modal.removeClass("isTemplateProject")
    modal.modal('show');
}
function startNewLynnaLabProject(cloneURL = "https://github.com/Stewmath/oracles-disasm.git") { 
    // begin project creation after user input is finished
    if ($("#modalNewProjectChoice").hasClass("isTemplateProject")) {
        $("#modalNewProjectChoice").removeClass("isTemplateProject");
        $("#newProjectFromTemplate").modal('show');
    } else {
        $("#newProjectFromTemplate").modal('hide');
        if (navigator.userAgent.includes("Windows")) $("#newProjectLocationPath").val('C:\\');
        else $("#newProjectLocationPath").val('/');
        const projectConfirmModal = $("#projectLocationConfirmation");
        projectConfirmModal.modal('show');
        projectConfirmModal.find('form[action="javascript:;"]').submit(() => {
            const num = navigator.userAgent.includes("Windows") ? 3 : 1;
            const val = $("#newProjectLocationPath").val().substr(num);
            if (!val) return Messages.projectLocationConfirmationMsg("Please type in a location path for your new project.");
            projectConfirmModal.modal('hide');
            jQuery.blockUI();
            jQuery.post(
                `/oracles/api/LynnaLab/newProject/startClone?cloneURL=${cloneURL}&cloneDirectory=${$("#newProjectLocationPath").val().substr(num)}`, 
                d => {
                    if (d.errorMessage) Messages.feedbackBlock(d.errorMessage);
                    else {
                        function branchCheckout(branchName) {
                            jQuery.post(`/oracles/api/LynnaLab/newProject/branchCheckout?name=${branchName}&dir=${
                                d.projectNewfolder
                            }`, Messages.feedbackBlock)
                        }
                        if (d.data.length > 1) {
                            const modal = $("#projectBranchSelection");
                            modal.find("#branchSelection").html(d.data.map(v => `<option value="${v.name}">${v.name}</option>`).join(''));
                            modal.submit(() => {
                                jQuery.blockUI();
                                modal.modal('hide');
                                branchCheckout(modal.find("#branchSelection").val());
                            })
                            modal.modal('show');
                            jQuery.unblockUI();
                        } else branchCheckout(d.data[0].name)
                    }
                }
            )
        })
    }
}
class Messages {
    static projectPathMoveMsg(m) {
        $("#projectPathMoveMsg").text(m);
    }
    static projectLocationConfirmationMsg(m) {
        $("#projectLocationConfirmationMsg").text(m);
    }
    static feedbackBlock(m) {
        jQuery.growlUI("Notification", m, 3000 + 1000 + 700);
    }
}
$("#modalProjectDirectoryMove").on("shown.bs.modal", function () {
    // inputs a starting path for OS users
    if (navigator.userAgent.includes("Windows")) {
        $("#oldPath").val('C:\\');
        $("#newPath").val('C:\\')
    } else {
        $("#oldPath").val('/');
        $("#newPath").val('/');
    }
});
function projectMoveLocationEntered(obj) {
    const num = navigator.userAgent.includes("Windows") ? 3 : 1;
    const jqueryObject = $(obj);
    if (!jqueryObject.find("#oldPath").val().substr(num)) return Messages.projectPathMoveMsg("Please enter in the path for your oracles disasm folder.");
    if (!jqueryObject.find("#newPath").val().substr(num)) return Messages.projectPathMoveMsg("Please enter in the path you want to move your LynnaLab project to");
    $("#modalProjectDirectoryMove").modal('hide')
    jQuery.blockUI();
    jQuery.post(`/oracles/api/LynnaLab/moveProject?disasmFolderPath=${
        jqueryObject.find("#oldPath").val().substr(num)
    }&moveToDir=${jqueryObject.find("#newPath").val().substr(num)}`, Messages.feedbackBlock);
}