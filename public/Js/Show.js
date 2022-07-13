
$(document).ready(function () {

    $nav = $('.nav');
    $solid = $('.fa-solid.fa-heart');
    $regular = $('.fa-regular.fa-heart');
    $toggleCollapse = $('.toggle-collapse');
    $added = $('.popadd');
    $noadded = $('.popmin');
    $danger = $('.danger-alert p');


    
    /** click event on toggle menu */
    $toggleCollapse.click(function () {
        $nav.toggleClass('collapse');
    })
  
    // click to scroll up
    $('.move-up span').click(function(){
        $('html, body').animate({
            scrollTop: 0
        }, 1000)

    })


    //AOS inst
    AOS.init();

});