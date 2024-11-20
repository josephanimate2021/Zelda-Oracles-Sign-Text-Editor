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
$("#projectBranchSelection").on("hidden.bs.modal", () => {
    $("#projectBranchSelection").find('form[action="javascript:;"]').off("submit");
})
function startNewLynnaLabProject(cloneURL = "https://github.com/Stewmath/oracles-disasm.git") {
    const settings = JSON.parse(localStorage.getItem("oracles_appSettings"));
    // begin project creation after user input is finished
    if ($("#modalNewProjectChoice").hasClass("isTemplateProject")) { 
        // if user chose a template, show a modal for the user to input the template URL
        $("#modalNewProjectChoice").removeClass("isTemplateProject");
        $("#newProjectFromTemplate").modal('show');
    } else { // sets up the stuff needed to get the project creation ready
        $("#newProjectFromTemplate").modal('hide');
        if (navigator.userAgent.includes("Windows")) $("#newProjectLocationPath").val('C:\\');
        else $("#newProjectLocationPath").val('/');
        const projectConfirmModal = $("#projectLocationConfirmation");
        if (!settings.oraclesDisasmFolderPath) projectConfirmModal.modal('show');
        else gitClone();
        const submitToogle = projectConfirmModal.find('form[action="javascript:;"]');
        submitToogle.off("submit");
        submitToogle.on("submit", gitClone);
        function gitClone() { // begin the project clone using Git
            const num = navigator.userAgent.includes("Windows") ? 3 : 1;
            const val = (settings.oraclesDisasmFolderPath || $("#newProjectLocationPath").val()).substr(num);
            if (!val) return Messages.projectLocationConfirmationMsg("Please type in a location path for your new project.");
            projectConfirmModal.modal('hide');
            jQuery.blockUI();
            jQuery.post(`/oracles/api/LynnaLab/newProject/startClone?cloneURL=${cloneURL}&cloneDirectory=${
                val
            }`, d => { // after the project clone is finished, send feedback in case something went wrong. otherwise, things continue.
                if (d.errorMessage || d.data?.message) Messages.feedbackBlock({
                    messageType: d.messageType || "info",
                    text: `${d.data?.status ? `${d.data.status}: ` : ''}${d.data?.message || d.errorMessage}${
                        d.data?.documentation_url ? `<center><small>Refer <a href="${
                            d.data.documentation_url
                        }" target="_blank">here</a> for more infomation</small></center>` : d.outputResult ? `<center><small>Output: ${
                            d.outputResult
                        }</small></center>` : ''
                    }`
                });
                else { 
                    /* asks a user what branch they want to use their project 
                    using the data that the server generated based off of the URL used. */
                    function branchCheckout(branchName) { // checks out a branch name then sends feedback to the user.
                        jQuery.post(`/oracles/api/LynnaLab/newProject/branchCheckout?name=${branchName}&dir=${
                            d.projectNewfolder
                        }`, Messages.feedbackBlock)
                    }
                    if (d.data.length > 1) { // pop a branch selection modal if more than one item is in the data array
                        const modal = $("#projectBranchSelection");
                        modal.find("#branchSelection").html(d.data.map(v => `<option value="${v.name}">${v.name}</option>`).join(''));
                        modal.off("submit");
                        modal.on("submit", () => {
                            jQuery.blockUI();
                            modal.modal('hide');
                            branchCheckout(modal.find("#branchSelection").val());
                        })
                        modal.modal('show');
                        jQuery.unblockUI();
                    } else branchCheckout(d.data[0].name)
                }
            });
        }
    }
}
class Messages { // messages
    static projectPathMoveOrCopyMsg(m) { // messages for the project path move or copy modal
        $("#projectPathMoveMsg").text(m);
    }
    static projectLocationConfirmationMsg(m) { // messages for the project location confirmation modal
        $("#projectLocationConfirmationMsg").text(m);
    }
    static feedbackBlock(info) { // messages for the feedback block
        const html = (i) => `<div class="alert alert-${i.messageType} alert-dismissible fade show" role="alert">
            ${i.text}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
        $("#feedbackBlock").html(Array.isArray(info) ? info.map(html).join('') : typeof info == "object" ? html(info) : html({
            messageType: "info",
            text: info
        }));
        jQuery.unblockUI();
    }
}
function projectMoveOrCopyActionChanged(obj) { // changes text based off of user input
    const val = $(obj).val();
    const name = val == "cp" ? "Copy" : "Move";
    $(".projectMoveOrCopy").text(name)
}
$("#modalProjectDirectoryMoveOrCopy").on("shown.bs.modal", function () {
    const settings = JSON.parse(localStorage.getItem("oracles_appSettings"));
    projectMoveOrCopyActionChanged(document.getElementById('projectMoveOrCopy'))
    // inputs a starting path for OS users
    if (!settings.oraclesDisasmFolderPath) {
        if (navigator.userAgent.includes("Windows")) {
            $("#oldPath").val('C:\\');
            $("#newPath").val('C:\\')
        } else {
            $("#oldPath").val('/');
            $("#newPath").val('/');
        }
    } else {
        $("#oldPath").val(settings.oraclesDisasmFolderPath);
        $("#newPath").val(navigator.userAgent.includes("Windows") ? 'C:\\' : '/')
    }
});
$("#modalProjectDirectoryDelete").on("shown.bs.modal", function () { 
    // fills in a filepath starter to help the user understand and find their path easier.
    const settings = JSON.parse(localStorage.getItem("oracles_appSettings"));
    $("#disasmFolderPath1").val(settings.oraclesDisasmFolderPath || navigator.userAgent.includes("Windows") ? 'C:\\' : '/');
});
function projectLocationEntered4Delete(obj) { // confirms that the user does want to delete their project
    const val = $(obj).find("#disasmFolderPath1").val();
    const num = navigator.userAgent.includes("Windows") ? 3 : 1;
    if (!val.substr(num)) return Messages.projectPathDeleteMsg("Please enter in the folder path of your current LynnaLab project");
    $("#modalProjectDirectoryDelete").modal('hide');
    jQuery.blockUI();
    jQuery.post(`/oracles/api/LynnaLab/deleteProject?dir=${val.substr(num)}`, Messages.feedbackBlock);
}
function projectMoveOrCopyLocationEntered(obj) { // confirms that the user does want to move or copy their project
    const num = navigator.userAgent.includes("Windows") ? 3 : 1;
    const jqueryObject = $(obj);
    if (!jqueryObject.find("#oldPath").val().substr(num)) return Messages.projectPathMoveOrCopyMsg(
        "Please enter in the path for your oracles disasm folder."
    );
    if (!jqueryObject.find("#newPath").val().substr(num)) return Messages.projectPathMoveOrCopyMsg(
        "Please enter in the path you want to move or copy your LynnaLab project to"
    );
    $("#modalProjectDirectoryMoveOrCopy").modal('hide')
    jQuery.blockUI();
    jQuery.post(`/oracles/api/LynnaLab/projectAction/moveOrCopy/command/${jqueryObject.find("#projectMoveOrCopy").val()}?oldPath=${
        jqueryObject.find("#oldPath").val().substr(num)
    }&newPath=${jqueryObject.find("#newPath").val().substr(num)}`, Messages.feedbackBlock);
}