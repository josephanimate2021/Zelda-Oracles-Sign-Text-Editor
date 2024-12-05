// Code for the LAS Rando (Web Version)
jQuery.post("/las/rando/api/otherSettings/get", d => {
    $("#otherSettings").html(d.map(v => `<div class="form-check">
        <input id="${v.substr(v.lastIndexOf("-") + 1)}" name="other_settings[${v}]" type="checkbox" class="form-check-input">
        <label class="form-check-label" for="${v.substr(v.lastIndexOf("-") + 1)}">${v.split("-").map(i => {
            const m = i.substr(1);
            const l = m.length;
            return i.slice(0, -l).toUpperCase() + m;
        }).join(' ')}</label>
    </div>`).join(''));
})
function genRando(form) {
    $("#rando-main").hide();
    $("#rando-wait").show();
    jQuery.post(`/las/rando/generate?${$(form).serialize()}`, d => {
        if (d.code == 0) {
            addLine(d.stdout);
            function randoStats(c = 1) {
                jQuery.post(`/stuff/api/status/generation/${c}`, k => {
                    if (!k.done) {
                        if (k.data.code == 0) {
                            addLine(k.data.stdout);
                            randoStats(c + 1);
                        } else {
                            $("#rando-wait").hide();
                            $("#rando-main").show();
                            Messages.feedbackBlock({
                                messageType: "danger",
                                text: k.data.stderr
                            });
                        }
                    } else {
                        $("#rando-wait").hide();
                        $("#rando-main").show();
                        Messages.feedbackBlock({
                            messageType: "success",
                            text: "Your LAS Rando was built successfuly!"
                        });
                        $("#console_p").html('')
                    }
                })
            }
            randoStats();
        } else {
            $("#rando-wait").hide();
            $("#rando-main").show();
            Messages.feedbackBlock({
                messageType: "danger",
                text: d.error || d.stderr
            });
            if (d.fillFields) for (const field of d.fillFields) {
                $(`#${field}`).addClass("needsAttention");
                $(`#${field}`).on("click", () => {
                    $(`#${field}`).off("click");
                    jQuery(`#${field}`).removeClass("needsAttention");
                })
            }
        }
    })
}
function addLine(line) {
    $("#console_p").append(`${line}<br>`);
}