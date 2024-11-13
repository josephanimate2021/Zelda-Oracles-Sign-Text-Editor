// Code for adding text to new signs (depending on the room index & position) in both Zelda Oracle Games
(() => {
  'use strict'
  function sendRequestMessage(msg, color) {
    $("#requestMessageBlock").css("color", color).html(msg);
  }
  // Fetch all the forms we want to apply the custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')
  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      let formValidated = false;
      // have the user wait during form submission
      sendRequestMessage();
      jQuery.blockUI();
      if (!form.checkValidity()) { // if everything is invalid, do not peform a form submission request
        event.preventDefault()
        event.stopPropagation()
        formValidated = true;
      } else { // if valid, the request will be performed.
        jQuery.post(`/oracles/api/signText/add?${$(form).serialize()}`, d => { // after the request, send the user a message
          formValidated = true;
          sendRequestMessage(d.msg, d.color)
        })
      }
      // after form submission, unblock the user's window and tell the form that it was validated
      const interval = setInterval(() => {
        if (formValidated) {
          jQuery.unblockUI();
          form.classList.add('was-validated');
          clearInterval(interval);
        }
      }, 1)
    }, false)
  })
})();
