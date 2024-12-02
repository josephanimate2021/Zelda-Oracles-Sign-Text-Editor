// Code for the LAS Rando (Web Version)
jQuery.post("/las/rando/api/otherSettings/get", d => {
    console.log(d)
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
        addLine(d.stdout || d.stderr);
        function randoStats(c = 1) {
            jQuery.post(`/stuff/api/status/generation/${c}`, k => {
                if (!k.done) {
                    addLine(k.data.stdout || k.data.stderr);
                    randoStats(c + 1);
                } else {
                    $("#rando-wait").hide();
                    $("#rando-main").show();
                    Messages.feedbackBlock({
                        messageType: "success",
                        text: "Your LAS Rando was built successfuly!"
                    });
                }
            })
        }
        if (!d.error) randoStats();
        else {
            $("#rando-wait").hide();
            $("#rando-main").show();
            Messages.feedbackBlock({
                messageType: "danger",
                text: d.error
            });
            if (d.fillFields) for (const field of d.fillFields) {
                $(`#${field}`).addClass("needsAttention");
            }
        }
    })
}
function addLine(line) {
    $("#console_p").append(`${line}<br>`);
}