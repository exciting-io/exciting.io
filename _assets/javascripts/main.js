//= require bootstrap
//= require_tree .

$(function() {
  $(".title h1").lettering();
  $('form.mailchimp').ajaxChimp();
  (function() {
    var backgrounds = ['bokeh',
      'bricks',
      'bridge-at-night',
      'bridge-from-below',
      'buildings',
      'doors',
      'forest',
      'hiker',
      'millenium-bridge',
      'mist',
      'mountains',
      'phones-and-coffee',
      'rail-bridge',
      'shoes-in-field',
      'window-raindrops'];
      var selected_background = backgrounds[Math.round(Math.random()*backgrounds.length)];
      $("body.wide header").attr('class', selected_background);
  })();
})
