const responsive = {
    0 : {
        items: 1
    },
    1000 : {
        items: 4
    },
    1100: {
        items: 5
    },
    1250: {
        items: 6
    },
    1500: {
        items: 8
    },
}



$(document).ready(function(){
    $('.owl-carousel').owlCarousel({
        loop:true,
        nav:false,
        autoplay:true,
        autoplayTimeout:4000,
        dots: false,
        items: 8,
        responsive: responsive
    });
  });

  $(window).resize()