$( document ).ready(function() {
    $('.active').each(function(i, obj) {
        var repo = $(this).attr('data-repo');
        var version = $(this).attr('data-version');
        $.post( "/versioncheck", { repo: repo, version: version } )
          .done(function( data ) {
            console.log( data );
          });
    });
    
    
    
    $('#test').on('click', function() {
        var parent = $(this).parent();
         
        var repo = $(this).attr('data-repo');
        $.post( "/getrelease", { repo: $(parent).attr('data-repo') } )
          .done(function( data ) {
            console.log( data );
          });
    });    
    
});