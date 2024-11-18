// This script helps add some basic functionality that don't exist like LynnaLab; (Example: New Project)
function newLynnaLabProjectFromTemplate(isReallyUsingTemplate = true) { 
    // allows a user to create a new project using any oracles-disam templates he/she finds on github
    const modal = $("#modalNewProjectChoice");
    if (isReallyUsingTemplate && !modal.hasClass("isTemplateProject")) modal.addClass("isTemplateProject")
    else if (modal.hasClass("isTemplateProject")) modal.removeClass("isTemplateProject")
    modal.modal('show');
}
$("#projectLocationConfirmation").on("hidden.bs.modal", () => {
    $("#projectLocationConfirmation").find('form[action="javascript:;"]').off("submit");
})
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
        const submitToogle = projectConfirmModal.find('form[action="javascript:;"]');
        submitToogle.on("submit", () => {
            submitToogle.off("submit");
            const num = navigator.userAgent.includes("Windows") ? 3 : 1;
            const val = $("#newProjectLocationPath").val().substr(num);
            if (!val) return Messages.projectLocationConfirmationMsg("Please type in a location path for your new project.");
            projectConfirmModal.modal('hide');
            jQuery.blockUI();
            jQuery.post(
                `/oracles/api/LynnaLab/newProject/startClone?cloneURL=${cloneURL}&cloneDirectory=${$("#newProjectLocationPath").val().substr(num)}`, 
                d => {
                    if (d.errorMessage || d.data.message) Messages.feedbackBlock(d.errorMessage || d.data.message);
                    else {
                        function branchCheckout(branchName) {
                            jQuery.post(`/oracles/api/LynnaLab/newProject/branchCheckout?name=${branchName}&dir=${
                                d.projectNewfolder
                            }`, Messages.feedbackBlock)
                        }
                        if (d.data.length > 1) {
                            const modal = $("#projectBranchSelection");
                            modal.find("#branchSelection").html(d.data.map(v => `<option value="${v.name}">${v.name}</option>`).join(''));
                            modal.on("submit", () => {
                                modal.off("submit");
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
    static projectPathMoveOrCopyMsg(m) {
        $("#projectPathMoveMsg").text(m);
    }
    static projectLocationConfirmationMsg(m) {
        $("#projectLocationConfirmationMsg").text(m);
    }
    static feedbackBlock(m) {
        jQuery.growlUI("Notification", m, 3000 + 1000 + 700);
    }
}
function projectMoveOrCopyActionChanged(obj) {
    const val = $(obj).val();
    const name = val == "cp" ? "Copy" : "Move";
    $(".projectMoveOrCopy").text(name)
}
$("#modalProjectDirectoryMoveOrCopy").on("shown.bs.modal", function () {
    projectMoveOrCopyActionChanged(document.getElementById('projectMoveOrCopy'))
    // inputs a starting path for OS users
    if (navigator.userAgent.includes("Windows")) {
        $("#oldPath").val('C:\\');
        $("#newPath").val('C:\\')
    } else {
        $("#oldPath").val('/');
        $("#newPath").val('/');
    }
});
$("#modalProjectDirectoryDelete").on("shown.bs.modal", function () {
    // inputs a starting path for OS users
    if (navigator.userAgent.includes("Windows")) $("#disasmFolderPath1").val('C:\\');
    else $("#disasmFolderPath1").val('/');
});
function projectLocationEntered4Delete(obj) {
    const val = $(obj).find("#disasmFolderPath1").val();
    const num = navigator.userAgent.includes("Windows") ? 3 : 1;
    if (!val.substr(num)) return Messages.projectPathDeleteMsg("Please enter in the folder path of your current LynnaLab project");
    $("#modalProjectDirectoryDelete").modal('hide');
    jQuery.blockUI();
    jQuery.post(`/oracles/api/LynnaLab/deleteProject?dir=${val.substr(num)}`, Messages.feedbackBlock);
}
function projectMoveOrCopyLocationEntered(obj) {
    const num = navigator.userAgent.includes("Windows") ? 3 : 1;
    const jqueryObject = $(obj);
    if (!jqueryObject.find("#oldPath").val().substr(num)) return Messages.projectPathMoveOrCopyMsg("Please enter in the path for your oracles disasm folder.");
    if (!jqueryObject.find("#newPath").val().substr(num)) return Messages.projectPathMoveOrCopyMsg("Please enter in the path you want to move or copy your LynnaLab project to");
    $("#modalProjectDirectoryMoveOrCopy").modal('hide')
    jQuery.blockUI();
    jQuery.post(`/oracles/api/LynnaLab/projectAction/moveOrCopy/command/${jqueryObject.find("#projectMoveOrCopy").val()}?oldPath=${
        jqueryObject.find("#oldPath").val().substr(num)
    }&newPath=${jqueryObject.find("#newPath").val().substr(num)}`, Messages.feedbackBlock);
}