//= require bootstrap
//= require_tree .

$(function() {
  $(".title h1").lettering();
  $('form.mailchimp').ajaxChimp();
})
